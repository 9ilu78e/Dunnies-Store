import { NextRequest, NextResponse } from 'next/server';
import { BrevoEmailError, sendBrevoEmail } from "@/lib/brevoEmail";
import { createEmailVerificationCodeEmail } from "@/lib/emails/emailVerificationEmail";

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number; email: string; verified?: boolean }>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < now) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!process.env.BREVO_API_KEY?.trim() || !process.env.SENDER_EMAIL?.trim()) {
      return NextResponse.json(
        { error: 'Email verification is not configured. Set BREVO_API_KEY and SENDER_EMAIL.' },
        { status: 503 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code
    verificationCodes.set(sessionId, { code, expires, email });

    // Send email
    const html = createEmailVerificationCodeEmail(code);

    await sendBrevoEmail({
      to: email,
      subject: 'Verify Your Email - Dunnis Stores',
      html,
    });

    return NextResponse.json({ 
      message: 'Verification code sent successfully',
      sessionId 
    });

  } catch (error: any) {
    if (error instanceof BrevoEmailError) {
      console.error("Brevo rejected the email verification message:", {
        status: error.status,
        code: error.providerCode,
      });
    } else {
      console.error('Error sending verification email:', error);
    }
    return NextResponse.json({ 
      error: 'Failed to send verification email. Please try again.' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json();

    if (!sessionId || !code) {
      return NextResponse.json({ error: 'Session ID and code are required' }, { status: 400 });
    }

    // Get stored verification data
    const verificationData = verificationCodes.get(sessionId);

    if (!verificationData) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 });
    }

    // Check if code has expired
    if (Date.now() > verificationData.expires) {
      verificationCodes.delete(sessionId);
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Verify code
    if (verificationData.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Code is valid - mark as verified
    verificationData.verified = true;
    verificationCodes.set(sessionId, verificationData);

    return NextResponse.json({ 
      message: 'Email verified successfully',
      email: verificationData.email 
    });

  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ 
      error: 'Failed to verify code. Please try again.' 
    }, { status: 500 });
  }
}
