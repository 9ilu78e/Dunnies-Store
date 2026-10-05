import { NextResponse } from 'next/server';
import { BrevoEmailError, sendBrevoEmail } from "@/lib/brevoEmail";
import { testEmailHtml } from "@/lib/emails/testEmail";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const senderEmail = process.env.SENDER_EMAIL?.trim();
    if (!senderEmail) {
      return NextResponse.json(
        { error: "SENDER_EMAIL is not configured." },
        { status: 503 }
      );
    }

    const messageId = await sendBrevoEmail({
      to: senderEmail,
      subject: 'Test Email - Dunnis Stores',
      html: testEmailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId
    });

  } catch (error: unknown) {
    if (error instanceof BrevoEmailError) {
      console.error("Brevo email test failed:", {
        status: error.status,
        code: error.providerCode,
      });
    } else {
      console.error("Brevo email test failed:", error);
    }
    return NextResponse.json(
      { error: "Email test failed. Check the Brevo API configuration and verified sender." },
      { status: 503 }
    );
  }
}
