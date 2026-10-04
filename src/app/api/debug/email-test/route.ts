import { NextResponse } from 'next/server';
import { BrevoEmailError, sendBrevoEmail } from "@/lib/brevoEmail";

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
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Dunnis Stores.</p>
        <p>If you receive this, email sending is working!</p>
      `,
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
