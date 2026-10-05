import { getBaseUrl } from "@/utils/url";
import { escapeHtml } from "./shared";

export function createNewsletterSubscriptionEmail(
  email: string,
  storeName: string,
  supportEmail: string
): string {
  const safeEmail = escapeHtml(email);
  const safeStore = escapeHtml(storeName);
  const safeSupport = escapeHtml(supportEmail);
  const storeUrl = escapeHtml(getBaseUrl());

  const perk = (emoji: string, title: string, text: string) => `
    <tr>
      <td width="44" valign="top" style="width:44px;padding:10px 0;">
        <div style="width:36px;height:36px;border-radius:10px;background:#f5f3ff;text-align:center;line-height:36px;font-size:18px;">${emoji}</div>
      </td>
      <td valign="top" style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:15px;font-weight:bold;color:#111827;">${title}</div>
        <div style="margin-top:2px;font-size:13px;line-height:1.5;color:#6b7280;">${text}</div>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Subscription confirmed</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f3f0fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    a { color: #7c3aed; }
    @media only screen and (max-width: 620px) {
      .outer-pad { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .hero-title { font-size: 22px !important; }
      .cta a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f0fa;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    You're subscribed to ${safeStore} newsletters. Store news, gift inspiration and special offers are on the way.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f0fa" style="background:#f3f0fa;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 12px;">
        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Brand header -->
          <tr>
            <td class="px" bgcolor="#7c3aed" style="padding:22px 32px;background:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#c026d3 100%);font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">
              ${safeStore}
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
              <h1 class="hero-title" style="margin:20px 0 8px;font-size:26px;line-height:1.25;color:#111827;font-weight:bold;">Subscription confirmed</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
                Hello <strong style="color:#111827;word-break:break-all;">${safeEmail}</strong>,<br />
                you've successfully subscribed to ${safeStore} newsletters.
              </p>
            </td>
          </tr>

          <!-- What to expect -->
          <tr>
            <td class="px" style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#7c3aed;padding-bottom:2px;">What you'll get</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${perk("📰", "Store news", "Be first to hear about new arrivals and updates.")}
                      ${perk("🎁", "Gift inspiration", "Fresh ideas for every occasion and budget.")}
                      ${perk("🏷️", "Special offers", "Exclusive deals just for subscribers.")}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px cta" align="center" style="padding:26px 32px 8px;">
              <a href="${storeUrl}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:14px;">Start shopping</a>
            </td>
          </tr>

          <!-- Unsubscribe + sign-off -->
          <tr>
            <td class="px" style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#4b5563;">
              You can unsubscribe at any time by contacting
              <a href="mailto:${safeSupport}" style="color:#6d28d9;font-weight:bold;text-decoration:none;word-break:break-all;">${safeSupport}</a>.
              <p style="margin:20px 0 0;">Thank you,<br /><strong style="color:#111827;">${safeStore} Team</strong></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" style="padding:28px 32px 30px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:12px;line-height:1.6;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${safeStore}. All rights reserved.<br />
                You're receiving this email because ${safeEmail} was subscribed to our newsletter.
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