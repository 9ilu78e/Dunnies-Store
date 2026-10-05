import { escapeHtml } from "./shared";

export function createContactNotificationEmail(details: {
  adminName: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inboxUrl: string;
}): string {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2>New contact message</h2><p>Hello ${escapeHtml(details.adminName)},</p><p><strong>From:</strong> ${escapeHtml(details.name)} (${escapeHtml(details.email)})</p><p><strong>Phone:</strong> ${escapeHtml(details.phone || "Not provided")}</p><p><strong>Subject:</strong> ${escapeHtml(details.subject)}</p><p>${escapeHtml(details.message).replace(/\r?\n/g, "<br>")}</p><p>Review and respond in the <a href="${escapeHtml(details.inboxUrl)}">admin message inbox</a>.</p></div>`;
}
