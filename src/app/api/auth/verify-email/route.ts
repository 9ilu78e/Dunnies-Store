import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number; email: string }>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < now) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp-brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

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

    // Generate verification code
    const code = generateVerificationCode();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code
    verificationCodes.set(sessionId, { code, expires, email });

    // Send email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Verify Your Email - Dunnis Stores',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; font-size: 24px; margin-bottom: 10px;">Dunnis Stores</h1>
            <p style="color: #666; font-size: 16px;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">Your Verification Code</h2>
            <div style="background: #8b5cf6; color: white; font-size: 32px; font-weight: bold; padding: 15px 25px; border-radius: 8px; letter-spacing: 3px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">This code will expire in 10 minutes</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>If you didn't request this verification code, please ignore this email.</p>
            <p style="margin-top: 10px;">This is an automated message from Dunnis Stores.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: 'Verification code sent successfully',
      sessionId 
    });

  } catch (error: any) {
    console.error('Error sending verification email:', error);
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
