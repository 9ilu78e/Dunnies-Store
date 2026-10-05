import {
  escapeHtml,
  formatNaira,
  getSafeEmailImageUrl,
  type OrderStatusEmailDetails,
} from "./shared";

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
