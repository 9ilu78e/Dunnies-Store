import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
} from "@/lib/sizeVariants";
import { formatOrderNumber } from "@/lib/orderNumber";
import { getBaseUrl } from "@/utils/url";
import {
  escapeHtml,
  formatNaira,
  getSafeEmailImageUrl,
  type OrderEmailItem,
} from "./shared";

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
  const deliveryPending = deliveryFee === null || deliveryFee <= 0;

  const baseUrl = getBaseUrl();
  const formattedOrderNumber =
    orderNumber !== undefined ? formatOrderNumber(orderNumber) : undefined;
  const orderUrl = formattedOrderNumber
    ? `${baseUrl}/orders?orderNumber=${formattedOrderNumber}`
    : `${baseUrl}/orders`;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const safeName = escapeHtml(customerName);
  const sourceLabel =
    source === "whatsapp"
      ? "WhatsApp"
      : source === "site"
      ? "Website"
      : escapeHtml(source);

  const itemsHtml = items
    .map((item) => {
      const imageUrl = getSafeEmailImageUrl(item.imageUrl);
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td class="item-pad" style="padding:16px 0;border-bottom:1px solid #eeeaf7;" valign="top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="72" valign="top" style="width:72px;padding-right:14px;">
                  ${
                    imageUrl
                      ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:12px;border:1px solid #eeeaf7;background:#f5f3ff;" />`
                      : `<div style="width:72px;height:72px;border-radius:12px;background:#f5f3ff;text-align:center;line-height:72px;font-size:26px;">🎁</div>`
                  }
                </td>
                <td valign="top" style="font-family:Arial,Helvetica,sans-serif;">
                  <div style="font-size:15px;font-weight:bold;color:#111827;line-height:1.35;">${escapeHtml(item.name)}</div>
                  ${
                    item.categoryName
                      ? `<div style="margin-top:3px;font-size:12px;color:#7c3aed;">${escapeHtml(item.categoryName)}</div>`
                      : ""
                  }
                  <div style="margin-top:6px;font-size:13px;color:#6b7280;">Qty: <strong style="color:#111827;">${item.quantity}</strong></div>
                  ${
                    item.giftContents?.length
                      ? `<div style="margin-top:8px;padding:8px 10px;background:#f5f3ff;border-radius:8px;font-size:12px;color:#4b5563;line-height:1.6;">
                          <div style="font-weight:bold;color:#6d28d9;margin-bottom:2px;">Gift includes</div>
                          ${item.giftContents
                            .map(
                              (content) =>
                                `<div>${escapeHtml(content.name)}${
                                  content.size
                                    ? ` · ${escapeHtml(
                                        getVariantKindLabel(
                                          getVariantChoiceKind(content.size)
                                        )
                                      )} ${escapeHtml(
                                        formatVariantChoice(content.size)
                                      )}`
                                    : ""
                                } × ${content.quantity}</div>`
                            )
                            .join("")}
                        </div>`
                      : ""
                  }
                </td>
                <td class="item-price" width="110" align="right" valign="top" style="width:110px;font-family:Arial,Helvetica,sans-serif;text-align:right;">
                  <div style="font-size:15px;font-weight:bold;color:#111827;white-space:nowrap;">${formatNaira(lineTotal)}</div>
                  ${
                    item.quantity > 1
                      ? `<div style="margin-top:3px;font-size:12px;color:#9ca3af;white-space:nowrap;">${formatNaira(item.price)} each</div>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  const infoBlocks = [
    paymentMethod
      ? `<td class="stack" width="50%" valign="top" style="padding:0 6px 12px 0;">
          <div style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;font-weight:bold;color:#7c3aed;margin-bottom:6px;">Payment method</div>
            <div style="font-size:14px;color:#111827;line-height:1.5;">${escapeHtml(paymentMethod)}</div>
          </div>
        </td>`
      : "",
    deliveryAddress
      ? `<td class="stack" width="50%" valign="top" style="padding:0 0 12px 6px;">
          <div style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;font-weight:bold;color:#7c3aed;margin-bottom:6px;">Delivery address</div>
            <div style="font-size:14px;color:#111827;line-height:1.5;">${escapeHtml(deliveryAddress).replace(/\r?\n/g, "<br />")}</div>
          </div>
        </td>`
      : "",
  ].join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Order confirmation</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f3f0fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: #7c3aed; }
    @media only screen and (max-width: 620px) {
      .outer-pad { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .px { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 22px !important; }
      .stack { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
      .item-price { width: 84px !important; }
      .cta a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f0fa;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${
      formattedOrderNumber
        ? `Order #${formattedOrderNumber} is confirmed. `
        : "Your order is confirmed. "
    }We'll keep you updated on its status.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f0fa" style="background:#f3f0fa;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 12px;">
        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Brand header -->
          <tr>
            <td class="px" bgcolor="#7c3aed" style="padding:22px 32px;background:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#c026d3 100%);font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">Dunnis Stores</td>
                  <td align="right" style="font-size:13px;color:#f5e1ff;">
                    ${formattedOrderNumber ? `Order #${formattedOrderNumber}` : "Order confirmation"}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px" align="center" style="padding:36px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" valign="middle" width="64" height="64" bgcolor="#10b981" style="width:64px;height:64px;border-radius:32px;background:#10b981;color:#ffffff;font-size:34px;font-weight:bold;line-height:64px;text-align:center;">&#10003;</td>
                </tr>
              </table>
              <h1 class="hero-title" style="margin:20px 0 8px;font-size:26px;line-height:1.25;color:#111827;font-weight:bold;">Thank you for your order, ${safeName}!</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
                ${
                  formattedOrderNumber
                    ? `Your order <strong style="color:#6d28d9;">#${formattedOrderNumber}</strong> has been received and is being processed.`
                    : "Your order has been received and is being processed."
                }
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px cta" align="center" style="padding:22px 32px 8px;">
              <a href="${orderUrl}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:14px;">View my order</a>
            </td>
          </tr>

          <!-- Payment + delivery -->
          ${
            infoBlocks
              ? `<tr>
            <td class="px" style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>${infoBlocks}</tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Items -->
          <tr>
            <td class="px" style="padding:12px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#111827;padding-bottom:4px;border-bottom:2px solid #7c3aed;display:inline-block;">
                Order summary <span style="font-weight:normal;color:#9ca3af;font-size:13px;">(${itemCount} ${itemCount === 1 ? "item" : "items"})</span>
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td class="px" style="padding:8px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4b5563;">
                <tr>
                  <td style="padding:8px 0;">Products subtotal</td>
                  <td align="right" style="padding:8px 0;color:#111827;font-weight:bold;white-space:nowrap;">${formatNaira(productsTotal)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">Delivery</td>
                  <td align="right" style="padding:8px 0;color:#111827;font-weight:bold;white-space:nowrap;">${
                    deliveryPending ? "Pending" : formatNaira(deliveryFee as number)
                  }</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff;border-radius:12px;">
                      <tr>
                        <td style="padding:16px 18px;font-size:16px;font-weight:bold;color:#111827;">
                          Total${
                            deliveryPending
                              ? `<div style="font-size:12px;font-weight:normal;color:#6b7280;margin-top:2px;">Delivery fee pending</div>`
                              : ""
                          }
                        </td>
                        <td align="right" style="padding:16px 18px;font-size:22px;font-weight:bold;color:#6d28d9;white-space:nowrap;">${formatNaira(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Source -->
          <tr>
            <td class="px" style="padding:18px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;">
              Order source: <strong style="color:#111827;">${sourceLabel}</strong>
            </td>
          </tr>

          <!-- What's next -->
          <tr>
            <td class="px" style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#4b5563;">
                    <strong style="color:#111827;">What happens next?</strong><br />
                    We'll keep you updated on your order status. If you have any questions, please don't hesitate to reach out.
                    <br /><a href="${baseUrl}/help" style="color:#7c3aed;font-weight:bold;text-decoration:none;">Visit our Help page</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" style="padding:28px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:14px;font-weight:bold;color:#6d28d9;">Dunnis Stores</div>
              <div style="margin-top:6px;font-size:12px;line-height:1.6;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Dunnis Stores. All rights reserved.<br />
                You're receiving this email because you placed an order on our store.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}