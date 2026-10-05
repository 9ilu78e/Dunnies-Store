import { getBaseUrl } from "@/utils/url";
import {
  escapeHtml,
  formatNaira,
  getSafeEmailImageUrl,
  type OrderEmailItem,
} from "./shared";

export type PaymentReceiptDetails = {
  customerName: string;
  orderNumber: string;
  amount: number;
  orderStatus: string;
  /** Optional extras. Everything below can be left out. */
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date | string;
  items?: OrderEmailItem[];
  /** Link used by the "Download receipt" button (e.g. a signed receipt URL). */
  receiptUrl?: string;
};

const formatPaidAt = (value?: Date | string) => {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
};

/** The receipt itself. Shared by the email and the downloadable attachment. */
function buildReceiptCard(details: PaymentReceiptDetails): string {
  const items = details.items ?? [];
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = items.length ? details.amount - itemsSubtotal : 0;
  const hasImages = items.some((item) => getSafeEmailImageUrl(item.imageUrl));
  const labelSpan = hasImages ? 2 : 1;

  const row = (label: string, value: string, first = false) => `
    <tr>
      <td width="42%" valign="top" style="padding:9px 0;${
        first ? "" : "border-top:1px solid #f1edfa;"
      }color:#6b7280;font-size:13px;">${label}</td>
      <td align="right" valign="top" style="padding:9px 0;${
        first ? "" : "border-top:1px solid #f1edfa;"
      }color:#111827;font-size:13px;font-weight:bold;word-break:break-word;">${value}</td>
    </tr>`;

  const detailRows = [
    row("Receipt no.", `#${escapeHtml(details.orderNumber)}`, true),
    row("Date paid", escapeHtml(formatPaidAt(details.paidAt))),
    details.paymentReference
      ? row("Payment reference", escapeHtml(details.paymentReference))
      : "",
    details.paymentMethod
      ? row("Payment method", escapeHtml(details.paymentMethod))
      : "",
    row("Payment status", `<span style="color:#059669;">Paid</span>`),
    row("Order status", escapeHtml(details.orderStatus)),
  ].join("");

  const itemRows = items
    .map((item) => {
      const imageUrl = getSafeEmailImageUrl(item.imageUrl);
      return `
        <tr>
          ${
            hasImages
              ? `<td width="48" valign="top" style="width:48px;padding:10px 10px 10px 0;border-top:1px solid #f1edfa;">${
                  imageUrl
                    ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" width="40" height="40" style="display:block;width:40px;height:40px;object-fit:cover;border-radius:8px;border:1px solid #eeeaf7;" />`
                    : ""
                }</td>`
              : ""
          }
          <td valign="top" style="padding:10px 0;border-top:1px solid #f1edfa;color:#111827;font-size:13px;line-height:1.4;">
            <strong>${escapeHtml(item.name)}</strong>
            <div style="margin-top:2px;color:#6b7280;font-size:12px;">Qty ${item.quantity} × ${formatNaira(item.price)}</div>
          </td>
          <td align="right" valign="top" style="padding:10px 0;border-top:1px solid #f1edfa;color:#111827;font-size:13px;font-weight:bold;white-space:nowrap;">${formatNaira(item.price * item.quantity)}</td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e9e3f7;border-radius:14px;">
      <tr>
        <td style="padding:22px 22px 8px;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" style="font-size:16px;font-weight:bold;color:#111827;">Payment receipt</td>
              <td align="right" valign="middle">
                <span style="display:inline-block;padding:5px 12px;border-radius:99px;background:#d1fae5;color:#047857;font-size:12px;font-weight:bold;">&#10003; PAID</span>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
            ${detailRows}
          </table>
        </td>
      </tr>

      ${
        items.length
          ? `<tr>
        <td style="padding:6px 22px 0;font-family:Arial,Helvetica,sans-serif;">
          <div style="margin-top:8px;color:#7c3aed;font-size:12px;font-weight:bold;">Items</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
            ${itemRows}
            <tr>
              <td colspan="${labelSpan}" style="padding:9px 0;border-top:1px solid #f1edfa;color:#6b7280;font-size:13px;">Items subtotal</td>
              <td align="right" style="padding:9px 0;border-top:1px solid #f1edfa;color:#111827;font-size:13px;font-weight:bold;white-space:nowrap;">${formatNaira(itemsSubtotal)}</td>
            </tr>
            ${
              deliveryFee > 0
                ? `<tr>
              <td colspan="${labelSpan}" style="padding:9px 0;border-top:1px solid #f1edfa;color:#6b7280;font-size:13px;">Delivery</td>
              <td align="right" style="padding:9px 0;border-top:1px solid #f1edfa;color:#111827;font-size:13px;font-weight:bold;white-space:nowrap;">${formatNaira(deliveryFee)}</td>
            </tr>`
                : ""
            }
          </table>
        </td>
      </tr>`
          : ""
      }

      <tr>
        <td style="padding:14px 22px 22px;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff;border-radius:12px;">
            <tr>
              <td style="padding:16px 18px;font-size:15px;font-weight:bold;color:#111827;">Amount paid</td>
              <td align="right" style="padding:16px 18px;font-size:22px;font-weight:bold;color:#6d28d9;white-space:nowrap;">${formatNaira(details.amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function createPaymentConfirmationEmail(
  details: PaymentReceiptDetails
): string {
  const baseUrl = getBaseUrl();
  const ordersUrl = escapeHtml(
    `${baseUrl}/orders?orderNumber=${encodeURIComponent(details.orderNumber)}`
  );
  const safeName = escapeHtml(details.customerName);
  const downloadUrl = details.receiptUrl ? escapeHtml(details.receiptUrl) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Payment receipt</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f3f0fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .outer-pad { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .px { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 22px !important; }
      .cta a { display: block !important; margin: 0 0 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f0fa;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Payment received for order #${escapeHtml(details.orderNumber)} — ${formatNaira(details.amount)}. Your receipt is inside.
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
                  <td style="font-size:22px;font-weight:bold;color:#ffffff;">Dunnis Stores</td>
                  <td align="right" style="font-size:13px;color:#f5e1ff;">Receipt #${escapeHtml(details.orderNumber)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px" align="center" style="padding:34px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" valign="middle" width="64" height="64" bgcolor="#10b981" style="width:64px;height:64px;border-radius:32px;background:#10b981;color:#ffffff;font-size:34px;font-weight:bold;line-height:64px;text-align:center;">&#10003;</td>
                </tr>
              </table>
              <h1 class="hero-title" style="margin:20px 0 8px;font-size:26px;line-height:1.25;color:#111827;font-weight:bold;">Payment received, ${safeName}!</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
                Your payment for order <strong style="color:#6d28d9;">#${escapeHtml(details.orderNumber)}</strong> has been verified successfully.
              </p>
            </td>
          </tr>

          <!-- Receipt -->
          <tr>
            <td class="px" style="padding:24px 32px 0;">
              ${buildReceiptCard(details)}
            </td>
          </tr>

          <!-- Buttons -->
          <tr>
            <td class="px cta" align="center" style="padding:24px 32px 8px;">
              ${
                downloadUrl
                  ? `<a href="${downloadUrl}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:14px;margin:0 4px 8px;">Download receipt</a>
              <a href="${ordersUrl}" style="display:inline-block;background:#ffffff;color:#6d28d9;border:2px solid #ddd6fe;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:14px;margin:0 4px 8px;">View my order</a>`
                  : `<a href="${ordersUrl}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:14px;">View my order</a>`
              }
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td class="px" style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;line-height:1.6;color:#4b5563;">
                    <strong style="color:#111827;">What happens next?</strong><br />
                    Your order will now continue through the normal fulfilment process. Payment confirmation does not mean that the order has been delivered.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" style="padding:28px 32px 30px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:14px;font-weight:bold;color:#6d28d9;">Dunnis Stores</div>
              <div style="margin-top:6px;font-size:12px;line-height:1.6;color:#9ca3af;">
                Keep this email as your proof of payment.<br />
                &copy; ${new Date().getFullYear()} Dunnis Stores. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Standalone receipt document, meant to be attached to the email (or served
 * from a download route). Opens in any browser and prints cleanly to PDF.
 */
export function createPaymentReceiptDocument(
  details: PaymentReceiptDetails
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt #${escapeHtml(details.orderNumber)} · Dunnis Stores</title>
  <style>
    body { margin: 0; padding: 24px 12px; background: #f3f0fa; font-family: Arial, Helvetica, sans-serif; color: #111827; }
    table { border-collapse: collapse; }
    .sheet { max-width: 560px; margin: 0 auto; }
    .brand { background: #7c3aed; background-image: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); color: #fff; padding: 20px 24px; border-radius: 14px 14px 0 0; font-size: 20px; font-weight: bold; }
    .body { background: #fff; padding: 20px; border-radius: 0 0 14px 14px; }
    .foot { text-align: center; margin-top: 14px; font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .hint { text-align: center; margin: 0 0 14px; font-size: 12px; color: #6b7280; }
    @media print {
      body { background: #fff; padding: 0; }
      .hint { display: none; }
      .brand { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <p class="hint">Tip: use Print &rarr; Save as PDF to keep a PDF copy.</p>
  <div class="sheet">
    <div class="brand">Dunnis Stores</div>
    <div class="body">
      <p style="margin:0 0 14px;font-size:14px;color:#4b5563;">Hello ${escapeHtml(details.customerName)}, thank you for your payment. Here is your receipt.</p>
      ${buildReceiptCard(details)}
      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">Payment confirmation does not mean that the order has been delivered.</p>
    </div>
    <div class="foot">&copy; ${new Date().getFullYear()} Dunnis Stores. All rights reserved.</div>
  </div>
</body>
</html>`;
}