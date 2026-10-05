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
  const deliveryPending = deliveryFee === null || deliveryFee <= 0;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formattedOrderNumber = formatOrderNumber(orderNumber);
  const sourceLabel =
    source === "whatsapp" ? "WhatsApp" : source === "site" ? "Website" : source;
  const adminOrdersUrl = `${getBaseUrl()}/manage-orders`;
  const phoneText = customerPhone?.trim() || "";
  const phoneHref = phoneText.replace(/[^\d+]/g, "");

  const itemsHtml = items
    .map((item) => {
      const imageUrl = getSafeEmailImageUrl(item.imageUrl);
      const contents = item.giftContents?.length
        ? `<div style="margin-top:8px;padding:8px 10px;background:#f5f3ff;border-radius:8px;color:#4b5563;font-size:12px;line-height:1.6;">
            <div style="font-weight:bold;color:#6d28d9;margin-bottom:2px;">Gift includes</div>
            ${item.giftContents
              .map(
                (content) =>
                  `<div>${escapeHtml(content.name)}${
                    content.size
                      ? ` · ${escapeHtml(
                          getVariantKindLabel(getVariantChoiceKind(content.size))
                        )} ${escapeHtml(formatVariantChoice(content.size))}`
                      : ""
                  } × ${content.quantity}</div>`
              )
              .join("")}
          </div>`
        : "";
      return `
        <tr>
          <td class="item-pad" style="padding:14px 0;border-bottom:1px solid #eeeaf7;" valign="top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="68" valign="top" style="width:68px;padding-right:12px;">
                  ${
                    imageUrl
                      ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid #eeeaf7;background:#f5f3ff;" />`
                      : `<div style="width:56px;height:56px;border-radius:10px;background:#f5f3ff;text-align:center;line-height:56px;color:#7c3aed;font-size:11px;font-weight:bold;">ITEM</div>`
                  }
                </td>
                <td valign="top" style="font-family:Arial,Helvetica,sans-serif;">
                  <div style="color:#111827;font-size:14px;font-weight:bold;line-height:1.35;">${escapeHtml(item.name)}</div>
                  ${
                    item.categoryName
                      ? `<div style="margin-top:3px;color:#7c3aed;font-size:12px;font-weight:600;">${escapeHtml(item.categoryName)}</div>`
                      : ""
                  }
                  <div style="margin-top:5px;color:#6b7280;font-size:13px;">Qty: <strong style="color:#111827;">${item.quantity}</strong> &nbsp;·&nbsp; ${formatNaira(item.price)} each</div>
                  ${contents}
                </td>
                <td class="item-price" width="104" align="right" valign="top" style="width:104px;text-align:right;color:#111827;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;white-space:nowrap;">${formatNaira(item.price * item.quantity)}</td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  const detailRow = (label: string, value: string, first = false) => `
    <tr>
      <td class="label" width="96" valign="top" style="width:96px;padding:12px 16px;${
        first ? "" : "border-top:1px solid #eeeaf7;"
      }color:#7c3aed;font-size:12px;font-weight:bold;">${label}</td>
      <td valign="top" style="padding:12px 16px 12px 0;${
        first ? "" : "border-top:1px solid #eeeaf7;"
      }color:#111827;font-size:14px;line-height:1.5;word-break:break-word;">${value}</td>
    </tr>`;

  const detailRows = [
    detailRow("Customer", `<strong>${escapeHtml(customerName)}</strong>`, true),
    detailRow(
      "Email",
      `<a href="mailto:${escapeHtml(customerEmail)}" style="color:#6d28d9;text-decoration:none;">${escapeHtml(customerEmail)}</a>`
    ),
    detailRow(
      "Phone",
      phoneText
        ? `<a href="tel:${escapeHtml(phoneHref)}" style="color:#6d28d9;text-decoration:none;">${escapeHtml(phoneText)}</a>`
        : "Not provided"
    ),
    detailRow(
      "Delivery",
      escapeHtml(deliveryAddress || "Not provided").replace(/\r?\n/g, "<br>")
    ),
    paymentMethod ? detailRow("Payment", escapeHtml(paymentMethod)) : "",
  ].join("");

  const statCell = (label: string, value: string, last = false) => `
    <td class="stat" width="33.33%" valign="top" style="padding:0 ${
      last ? "0" : "8px"
    } 0 0;">
      <div style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;padding:12px 14px;font-family:Arial,Helvetica,sans-serif;">
        <div style="color:#7c3aed;font-size:11px;font-weight:bold;">${label}</div>
        <div class="stat-value" style="margin-top:4px;color:#111827;font-size:16px;font-weight:bold;word-break:break-word;">${value}</div>
      </div>
    </td>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>New order #${formattedOrderNumber}</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f3f0fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 640px) {
      .outer-pad { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .px { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 21px !important; }
      .stat-value { font-size: 14px !important; }
      .stat { padding-right: 6px !important; }
      .label { width: 78px !important; padding-left: 12px !important; }
      .item-price { width: 82px !important; }
      .cta a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f0fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    New order #${formattedOrderNumber} from ${escapeHtml(customerName)} — ${formatNaira(total)}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f0fa" style="background:#f3f0fa;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 12px;">
        <table role="presentation" class="card" width="680" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td class="px" bgcolor="#26104a" style="padding:28px 32px 24px;background:#26104a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
              <div style="color:#d8b4fe;font-size:13px;font-weight:bold;">Dunnis Stores · Admin</div>
              <h1 class="hero-title" style="margin:10px 0 0;font-size:26px;line-height:1.25;color:#ffffff;">A new order needs your attention</h1>
              <p style="margin:14px 0 0;color:#e9d5ff;font-size:15px;">
                Order <strong style="color:#ffffff;">#${formattedOrderNumber}</strong>
                &nbsp;<span style="display:inline-block;padding:4px 10px;border-radius:99px;background:#c026d3;color:#ffffff;font-size:11px;font-weight:bold;">${escapeHtml(status || "NEW").toUpperCase()}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td height="4" bgcolor="#7c3aed" style="height:4px;line-height:4px;font-size:0;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);">&nbsp;</td>
          </tr>

          <!-- Stats -->
          <tr>
            <td class="px" style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${statCell("Order total", formatNaira(total))}
                  ${statCell("Items", `${itemCount}`)}
                  ${statCell("Source", escapeHtml(sourceLabel), true)}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & delivery -->
          <tr>
            <td class="px" style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#111827;padding-bottom:4px;border-bottom:2px solid #7c3aed;display:inline-block;">Customer &amp; delivery</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;">
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td class="px" style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:16px;font-weight:bold;color:#111827;padding-bottom:4px;border-bottom:2px solid #7c3aed;display:inline-block;">Items ordered</div>
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
                  <td style="padding:8px 0;">Items subtotal</td>
                  <td align="right" style="padding:8px 0;color:#111827;font-weight:bold;white-space:nowrap;">${formatNaira(productsSubtotal)}</td>
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
                        <td style="padding:16px 18px;font-size:16px;font-weight:bold;color:#111827;">Total</td>
                        <td align="right" style="padding:16px 18px;font-size:22px;font-weight:bold;color:#6d28d9;white-space:nowrap;">${formatNaira(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px cta" align="center" style="padding:26px 32px 30px;">
              <a href="${escapeHtml(adminOrdersUrl)}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:12px;">Review this order</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" bgcolor="#faf8ff" style="padding:16px 32px;background:#faf8ff;border-top:1px solid #eeeaf7;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;font-size:11px;">
              Automated order notification · Dunnis Stores
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