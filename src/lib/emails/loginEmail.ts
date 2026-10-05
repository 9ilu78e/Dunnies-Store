export type LoginEmail = {
  subject: string;
  text: string;
  html: string;
};

const escapeHtmlAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function createLoginLinkEmail(verificationLink: string): LoginEmail {
  const safeLink = escapeHtmlAttr(verificationLink);

  return {
    subject: "Your Dunnis Stores sign-in link",
    text: `Use this link to sign in to Dunnis Stores:\n\n${verificationLink}\n\nThis link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your Dunnis Stores sign-in link</title>
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
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Tap the button to sign in to Dunnis Stores. This link expires in 15 minutes.
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
                  <td align="right" style="font-size:13px;color:#f5e1ff;">Secure sign-in</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px" align="center" style="padding:36px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" valign="middle" width="64" height="64" bgcolor="#f5f3ff" style="width:64px;height:64px;border-radius:32px;background:#f5f3ff;font-size:30px;line-height:64px;text-align:center;">🛍️</td>
                </tr>
              </table>
              <h1 class="hero-title" style="margin:20px 0 10px;font-size:26px;line-height:1.3;color:#111827;font-weight:bold;">Welcome back! Let's get you signed in</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">
                Tap the button below to securely sign in to your Dunnis Stores account and continue shopping.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px cta" align="center" style="padding:28px 32px 8px;">
              <a href="${safeLink}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:16px 40px;border-radius:14px;">Sign in to Dunnis Stores</a>
            </td>
          </tr>

          <!-- Expiry notice -->
          <tr>
            <td class="px" align="center" style="padding:12px 32px 24px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:99px;">
                <tr>
                  <td style="padding:8px 16px;font-size:13px;color:#4b5563;">
                    ⏱️ This link expires in <strong style="color:#6d28d9;">15 minutes</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td class="px" style="padding:0 32px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8ff;border:1px solid #eeeaf7;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">Button not working? Copy and paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;">
                      <a href="${safeLink}" style="color:#7c3aed;text-decoration:underline;">${safeLink}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td class="px" style="padding:18px 32px 30px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                If you didn't request this email, you can safely ignore it. Someone may have entered your email address by mistake. Never share this link with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" bgcolor="#faf8ff" style="padding:24px 32px 28px;background:#faf8ff;border-top:1px solid #eeeaf7;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:14px;font-weight:bold;color:#6d28d9;">Dunnis Stores</div>
              <div style="margin-top:6px;font-size:12px;line-height:1.6;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Dunnis Stores. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}