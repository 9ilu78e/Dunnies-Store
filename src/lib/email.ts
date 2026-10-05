export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const FORMSPREE_ID = process.env.FORMSPREE_ID || "mqajqokg";
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

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
export type { OrderEmailItem, OrderStatusEmailDetails } from "./emails/shared";
export { generateOrderConfirmationEmail } from "./emails/orderConfirmationEmail";
export { generateAdminOrderNotificationEmail } from "./emails/adminOrderNotificationEmail";
export { generateUserUpdateEmail } from "./emails/userUpdateEmail";
