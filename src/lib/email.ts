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
  imageUrl?: string;
  categoryName?: string;
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

function getSafeEmailImageUrl(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? escapeHtml(url.toString()) : "";
  } catch {
    return "";
  }
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
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${
            getSafeEmailImageUrl(item.imageUrl)
              ? `<img src="${getSafeEmailImageUrl(item.imageUrl)}" alt="${escapeHtml(item.name)}" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #eee;" />`
              : ""
          }
          <div><strong>${escapeHtml(item.name)}</strong>
            ${
              item.categoryName
                ? `<div style="margin-top:4px;color:#7c3aed;font-size:12px;">${escapeHtml(item.categoryName)}</div>`
                : ""
            }
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
          </div>
        </div>
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
    .map((item) => {
      const imageUrl = getSafeEmailImageUrl(item.imageUrl);
      const contents = item.giftContents?.length
        ? `<div style="margin-top:6px;color:#64748b;font-size:12px;">${item.giftContents
            .map(
              (content) =>
                `${escapeHtml(content.name)}${
                  content.size
                    ? ` · ${getVariantKindLabel(
                        getVariantChoiceKind(content.size)
                      )} ${formatVariantChoice(content.size)}`
                    : ""
                } × ${content.quantity}`
            )
            .join("<br>")}</div>`
        : "";
      return `
        <tr>
          <td style="padding:16px 18px;border-bottom:1px solid #eef2f7;">
            <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
              <td style="width:68px;vertical-align:top;">
                ${
                  imageUrl
                    ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;" />`
                    : `<div style="width:56px;height:56px;border-radius:10px;background:#f3e8ff;text-align:center;line-height:56px;color:#7e22ce;font-size:12px;font-weight:bold;">ITEM</div>`
                }
              </td>
              <td style="vertical-align:top;">
                <div style="color:#111827;font-weight:700;">${escapeHtml(item.name)}</div>
                ${
                  item.categoryName
                    ? `<div style="margin-top:4px;color:#7c3aed;font-size:12px;font-weight:600;">${escapeHtml(item.categoryName)}</div>`
                    : ""
                }
                ${contents}
              </td>
              <td style="width:48px;text-align:center;vertical-align:top;color:#475569;">×${item.quantity}</td>
              <td style="width:112px;text-align:right;vertical-align:top;color:#111827;font-weight:700;">${formatNaira(item.price * item.quantity)}</td>
            </tr></table>
          </td>
        </tr>`;
    })
    .join("");
  const sourceLabel =
    source === "whatsapp" ? "WhatsApp" : source === "site" ? "Website" : source;
  const adminOrdersUrl = `${getBaseUrl()}/manage-orders`;

  return `
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;">
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#f1f5f9;padding:28px 12px;">
        <tr><td align="center">
          <table role="presentation" style="width:100%;max-width:680px;border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,.08);">
            <tr><td style="padding:28px 32px;background:#26104a;color:#fff;">
              <p style="margin:0 0 10px;color:#d8b4fe;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Dunnis Stores · Admin</p>
              <h1 style="margin:0;font-size:26px;line-height:1.25;">A new order needs your attention</h1>
              <p style="margin:12px 0 0;color:#e9d5ff;font-size:15px;">Order #${formatOrderNumber(orderNumber)} <span style="padding:5px 9px;border-radius:99px;background:#7e22ce;color:#fff;font-size:11px;font-weight:bold;">${escapeHtml(status || "NEW").toUpperCase()}</span></p>
            </td></tr>
            <tr><td style="padding:24px 32px 8px;">
              <h2 style="margin:0 0 14px;color:#111827;font-size:16px;">Customer &amp; delivery</h2>
              <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr><td style="padding:14px 16px;color:#64748b;font-size:12px;">CUSTOMER</td><td style="padding:14px 16px;color:#111827;font-size:14px;font-weight:700;">${escapeHtml(customerName)}</td></tr>
                <tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">EMAIL</td><td style="padding:12px 16px;border-top:1px solid #e2e8f0;font-size:14px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color:#6d28d9;">${escapeHtml(customerEmail)}</a></td></tr>
                <tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">PHONE</td><td style="padding:12px 16px;border-top:1px solid #e2e8f0;color:#111827;font-size:14px;">${escapeHtml(customerPhone || "Not provided")}</td></tr>
                <tr><td style="padding:12px 16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">DELIVERY</td><td style="padding:12px 16px;border-top:1px solid #e2e8f0;color:#111827;font-size:14px;line-height:1.5;">${escapeHtml(deliveryAddress || "Not provided").replace(/\r?\n/g, "<br>")}</td></tr>
              </table>
              <p style="margin:14px 0 0;color:#475569;font-size:13px;"><strong>Order source:</strong> ${escapeHtml(sourceLabel)}${paymentMethod ? ` &nbsp;·&nbsp; <strong>Payment:</strong> ${escapeHtml(paymentMethod)}` : ""}</p>
            </td></tr>
            <tr><td style="padding:22px 32px 8px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:16px;">Items ordered</h2>
              <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eef2f7;border-radius:12px;overflow:hidden;"><tbody>${itemsHtml}</tbody></table>
            </td></tr>
            <tr><td style="padding:16px 32px 26px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:5px 0;color:#64748b;font-size:14px;">Items subtotal</td><td align="right" style="padding:5px 0;color:#334155;font-size:14px;">${formatNaira(productsSubtotal)}</td></tr>
                <tr><td style="padding:5px 0;color:#64748b;font-size:14px;">Delivery</td><td align="right" style="padding:5px 0;color:#334155;font-size:14px;">${deliveryFee === null || deliveryFee <= 0 ? "Pending" : formatNaira(deliveryFee)}</td></tr>
                <tr><td style="padding:14px 0 0;border-top:1px solid #e2e8f0;color:#111827;font-size:17px;font-weight:bold;">Total</td><td align="right" style="padding:14px 0 0;border-top:1px solid #e2e8f0;color:#6d28d9;font-size:20px;font-weight:bold;">${formatNaira(total)}</td></tr>
              </table>
              <div style="padding-top:24px;text-align:center;"><a href="${escapeHtml(adminOrdersUrl)}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#7e22ce;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;">Review this order</a></div>
            </td></tr>
            <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;text-align:center;font-size:11px;">Automated order notification · Dunnis Stores</td></tr>
          </table>
        </td></tr>
      </table>
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
                <div style="display:flex;align-items:center;gap:12px;">
                  ${
                    getSafeEmailImageUrl(item.imageUrl)
                      ? `<img src="${getSafeEmailImageUrl(item.imageUrl)}" alt="${escapeHtml(item.name)}" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #eee;" />`
                      : ""
                  }
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    ${
                      item.categoryName
                        ? `<div style="margin-top:4px;color:#7c3aed;font-size:12px;">${escapeHtml(item.categoryName)}</div>`
                        : ""
                    }
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
                  </div>
                </div>
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
