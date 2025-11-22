export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const FORMSPREE_ID = process.env.FORMSPREE_ID || "mqajqokg";
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const response = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  source: string
): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
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
          <p>Your order has been received and is being processed.</p>
          
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
            Total: ₦${total.toLocaleString()}
          </div>
          
          <p style="margin-top: 20px; color: #666;">
            <strong>Order Source:</strong> ${source === "whatsapp" ? "WhatsApp" : source === "site" ? "Website" : source}
          </p>
          
          <p style="margin-top: 20px;">We'll keep you updated on your order status. If you have any questions, please don't hesitate to reach out.</p>
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
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  source: string,
  orderId: string
): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
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
          <p>Order ID: <strong>${orderId}</strong></p>
        </div>
        
        <div class="customer-info">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Source:</strong> <span class="badge ${source === "whatsapp" ? "badge-whatsapp" : "badge-site"}">${source.toUpperCase()}</span></p>
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
          Total: ₦${total.toLocaleString()}
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/manage-orders" style="background: #a855f7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Admin Panel</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateUserUpdateEmail(
  customerName: string,
  subject: string,
  message: string
): string {
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
          <h1>${subject}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${customerName},</p>
          
          <div style="margin-top: 20px; line-height: 1.6;">
            ${message.split("\n").map((line) => `<p>${line}</p>`).join("")}
          </div>
          
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
