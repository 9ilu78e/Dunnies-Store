import { getBaseUrl } from "@/utils/url";
import { escapeHtml } from "./shared";

export function createNewsletterCampaignEmail(content: string): string {
  const lines = escapeHtml(content).split(/\r?\n/);
  const storeUrl = escapeHtml(getBaseUrl());

  const bodyHtml = lines
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#374151;word-break:break-word;">${line}</p>`
        : `<div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>`
    )
    .join("");

  const firstLine = lines.find((line) => line.trim()) ?? "";
  const preheader =
    firstLine.length > 110 ? `${firstLine.slice(0, 107)}...` : firstLine;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Dunnis Stores</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background: #f3f0fa; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    a { color: #7c3aed; }
    @media only screen and (max-width: 620px) {
      .outer-pad { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .cta a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f0fa;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f0fa" style="background:#f3f0fa;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 12px;">
        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Brand header -->
          <tr>
            <td class="px" bgcolor="#7c3aed" style="padding:22px 32px;background:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#c026d3 100%);font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">
              Dunnis Stores
            </td>
          </tr>

          <!-- Campaign content -->
          <tr>
            <td class="px" style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px cta" align="center" style="padding:24px 32px 32px;">
              <a href="${storeUrl}" style="display:inline-block;background:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#c026d3 100%);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:14px;">Visit our store</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" bgcolor="#faf8ff" style="padding:24px 32px 28px;background:#faf8ff;border-top:1px solid #eeeaf7;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:14px;font-weight:bold;color:#6d28d9;">Dunnis Stores</div>
              <div style="margin-top:6px;font-size:12px;line-height:1.6;color:#9ca3af;">
                You received this email because you subscribed to Dunnis Stores newsletters.<br />
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