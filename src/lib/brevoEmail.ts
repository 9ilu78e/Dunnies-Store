type BrevoEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export class BrevoEmailError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly providerCode?: string
  ) {
    super(message);
    this.name = "BrevoEmailError";
  }
}

export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
}: BrevoEmailOptions): Promise<string | undefined> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.SENDER_EMAIL?.trim();

  if (!apiKey || !senderEmail) {
    throw new BrevoEmailError(
      "BREVO_API_KEY and SENDER_EMAIL must be configured."
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Dunnis Stores", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    }),
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const providerCode =
      typeof result === "object" &&
      result !== null &&
      "code" in result &&
      typeof result.code === "string"
        ? result.code
        : undefined;
    throw new BrevoEmailError(
      "Brevo rejected the transactional email.",
      response.status,
      providerCode
    );
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "messageId" in result &&
    typeof result.messageId === "string"
  ) {
    return result.messageId;
  }

  return undefined;
}
