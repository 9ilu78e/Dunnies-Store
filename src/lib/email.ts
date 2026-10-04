import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
} from "@/lib/sizeVariants";
import { formatOrderNumber } from "@/lib/orderNumber";
import { getBaseUrl } from "@/utils/url";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
  giftContents?: Array<{ name: string; quantity: number; size?: string }>;
};

export type OrderStatusEmailDetails = {
  orderNumber: string;
  status: string;
  items: OrderEmailItem[];
  total: number;
  deliveryFee: number | null;
  deliveryAddress: string;
  paymentMethod: string;
  orderDate: Date;
};

const FORMSPREE_ID = process.env.FORMSPREE_ID || "mqajqokg";
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey) {
    const senderEmail = process.env.SENDER_EMAIL;
    if (!senderEmail) {
      throw new Error("SENDER_EMAIL must be configured to send email through Brevo.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: process.env.SENDER_NAME || "Dunnis Stores",
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Brevo email error (${response.status}): ${errorDetails || response.statusText}`
      );
    }

    return;
  }

  try {
    const response = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: options.to,
        subject: options.subject,
        message: options.html,
        _template: "table",
      }),
    });

    if (!response.ok) {
      throw new Error(`Formspree error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to send email via Formspree:", error);
    throw error;
  }
}

export function generateOrderConfirmationEmail(
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  source: string,
  orderNumber?: number,
  paymentMethod?: string,
  deliveryAddress?: string,
  configuredDeliveryFee?: number | null
): string {
  const productsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee =
    configuredDeliveryFee === undefined
      ? total - productsTotal
      : configuredDeliveryFee;
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}
        ${
          item.giftContents?.length
            ? `<ul style="margin: 6px 0 0; padding-left: 18px; font-size: 12px;">${item.giftContents
                .map(
                  (content) =>
                    `<li>${content.name}${
                      content.size
                        ? ` · ${getVariantKindLabel(
                            getVariantChoiceKind(content.size)
                          )} ${formatVariantChoice(content.size)}`
                        : ""
                    } × ${content.quantity}</li>`
                )
                .join("")}</ul>`
            : ""
        }
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatNaira(item.price)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 20px; border-radius: 8px; }
        .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 15px; background: white; border-radius: 8px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation 🎁</h1>
          <p>Thank you for your order, ${customerName}!</p>
        </div>

        <div class="content">
          <p>${
            orderNumber !== undefined
              ? `Your order <strong>#${formatOrderNumber(orderNumber)}</strong> has been received and is being processed.`
              : "Your order has been received and is being processed."
          }</p>

          ${(paymentMethod || deliveryAddress)
            ? `<p style="margin-top: 12px; color: #555; line-height: 1.6;">${
                paymentMethod ? `<strong>Payment:</strong> ${paymentMethod}<br />` : ""
              }${
                deliveryAddress ? `<strong>Delivery Address:</strong> ${deliveryAddress}` : ""
              }</p>`
            : ""}

          <table>
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Unit price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; text-align: right; line-height: 1.8;">
            <div>Products subtotal: ${formatNaira(productsTotal)}</div>
            <div>Delivery: ${deliveryFee === null || deliveryFee <= 0
              ? "Pending"
              : formatNaira(deliveryFee)}</div>
            <div class="total" style="margin-top: 8px; padding: 8px 0 0; border-top: 1px solid #eee;">
              Total${deliveryFee === null || deliveryFee <= 0 ? " (delivery pending)" : ""}: ${formatNaira(total)}
            </div>
          </div>

          <p style="margin-top: 20px; color: #666;">
            <strong>Order Source:</strong> ${
              source === "whatsapp"
                ? "WhatsApp"
                : source === "site"
                ? "Website"
                : source
            }
          </p>

          <p style="margin-top: 20px;">We'll keep you updated on your order status. If you have any questions, please don't hesitate to reach out.</p>
          <p style="margin-top: 12px;"><a href="${getBaseUrl()}/help" style="color: #7c3aed; font-weight: bold;">Visit our Help page</a></p>
        </div>

        <div class="footer">
          <p>&copy; 2025 Dunnis Stores. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateAdminOrderNotificationEmail(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: OrderEmailItem[],
  total: number,
  source: string,
  orderNumber: number,
  deliveryAddress?: string,
  paymentMethod?: string,
  status?: string,
  configuredDeliveryFee?: number | null
): string {
  const productsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee =
    configuredDeliveryFee === undefined
      ? total - productsSubtotal
      : configuredDeliveryFee;
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}
        ${
          item.giftContents?.length
            ? `<ul style="margin: 6px 0 0; padding-left: 18px; font-size: 12px;">${item.giftContents
                .map(
                  (content) =>
                    `<li>${content.name}${
                      content.size
                        ? ` · ${getVariantKindLabel(
                            getVariantChoiceKind(content.size)
                          )} ${formatVariantChoice(content.size)}`
                        : ""
                    } × ${content.quantity}</li>`
                )
                .join("")}</ul>`
            : ""
        }
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; }
        .customer-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 15px; background: white; border-radius: 8px; margin-top: 15px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-whatsapp { background: #25d366; color: white; }
        .badge-site { background: #3b82f6; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2 style="margin-top: 0;">🔔 New Order Received!</h2>
          <p>Order ID: <strong>#${formatOrderNumber(orderNumber)}</strong></p>
        </div>

        <div class="customer-info">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Source:</strong> <span class="badge ${
            source === "whatsapp" ? "badge-whatsapp" : "badge-site"
          }">${source.toUpperCase()}</span></p>
          ${
            paymentMethod ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>` : ""
          }
          ${
            deliveryAddress ? `<p><strong>Delivery Address:</strong> ${deliveryAddress}</p>` : ""
          }
          ${
            status ? `<p><strong>Status:</strong> ${status}</p>` : ""
          }
        </div>

        <h3>Order Items</h3>
        <table>
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          <div style="font-size: 14px; font-weight: normal; margin-bottom: 8px;">
            Products subtotal: ${formatNaira(productsSubtotal)}<br />
            Delivery: ${deliveryFee === null || deliveryFee <= 0
              ? "Pending"
              : formatNaira(deliveryFee)}
          </div>
          Total${deliveryFee === null || deliveryFee <= 0 ? " (delivery pending)" : ""}: ${formatNaira(total)}
        </div>

        <p style="margin-top: 30px; text-align: center;">
          <a href="${
            process.env.FRONTEND_URL ||
              process.env.NEXTAUTH_URL ||
              "http://localhost:3000"
          }/manage-orders" style="background: #a855f7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Admin Panel</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateUserUpdateEmail(
  customerName: string,
  subject: string,
  message: string,
  orderDetails?: OrderStatusEmailDetails
): string {
  const orderItemsHtml = orderDetails
    ? orderDetails.items
        .map(
          (item) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${escapeHtml(item.name)}
                ${
                  item.giftContents?.length
                    ? `<ul style="margin: 6px 0 0; padding-left: 18px; font-size: 12px;">${item.giftContents
                        .map(
                          (content) =>
                            `<li>${escapeHtml(content.name)}${
                              content.size
                                ? ` · ${escapeHtml(content.size)}`
                                : ""
                            } × ${content.quantity}</li>`
                        )
                        .join("")}</ul>`
                    : ""
                }
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatNaira(item.price)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatNaira(item.price * item.quantity)}</td>
            </tr>
          `
        )
        .join("")
    : "";
  const orderDetailsHtml = orderDetails
    ? `
      <section style="margin-top: 24px;">
        <h2>Order details</h2>
        <p><strong>Order number:</strong> #${escapeHtml(orderDetails.orderNumber)}</p>
        <p><strong>Status:</strong> ${escapeHtml(orderDetails.status)}</p>
        <p><strong>Order date:</strong> ${orderDetails.orderDate.toLocaleString("en-NG")}</p>
        <p><strong>Payment method:</strong> ${escapeHtml(orderDetails.paymentMethod)}</p>
        <p><strong>Delivery address:</strong><br />${escapeHtml(orderDetails.deliveryAddress).replace(/\n/g, "<br />")}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Unit price</th>
              <th style="padding: 10px; text-align: right;">Line total</th>
            </tr>
          </thead>
          <tbody>${orderItemsHtml}</tbody>
        </table>
        <div style="margin-top: 12px; text-align: right; line-height: 1.8;">
          <div>Products subtotal: ${formatNaira(orderDetails.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</div>
          <div>Delivery: ${orderDetails.deliveryFee === null || orderDetails.deliveryFee <= 0 ? "Pending" : formatNaira(orderDetails.deliveryFee)}</div>
          <strong>Total${orderDetails.deliveryFee === null || orderDetails.deliveryFee <= 0 ? " (delivery pending)" : ""}: ${formatNaira(orderDetails.total)}</strong>
        </div>
      </section>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 20px; border-radius: 8px; }
        .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(subject)}</h1>
        </div>

        <div class="content">
          <p>Hello ${escapeHtml(customerName)},</p>

          <div style="margin-top: 20px; line-height: 1.6;">
            ${message
              .split("\n")
              .map((line) => `<p>${escapeHtml(line)}</p>`)
              .join("")}
          </div>
          ${orderDetailsHtml}

          <p style="margin-top: 30px;">Best regards,<br>Dunnis Stores Team</p>
        </div>

        <div class="footer">
          <p>&copy; 2025 Dunnis Stores. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
