import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const verificationTokens = new Map<string, { email: string; expires: number; used: boolean }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationTokens.entries()) {
    if (value.expires < now) {
      verificationTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Generate verification token
const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

    // Generate verification token
    const token = generateVerificationToken();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    // Store verification token
    verificationTokens.set(token, { email, expires, used: false });

    // Send email
    const transporter = createTransporter();
    
    // Verify connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      throw new Error('Email service is temporarily unavailable. Please try again later.');
    }
    
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Login Verification - Dunnis Stores',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; font-size: 24px; margin-bottom: 10px;">Dunnis Stores</h1>
            <p style="color: #666; font-size: 16px;">Login Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">Click to Verify Your Login</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Click the button below to verify your email and login to your account</p>
            
            <a href="${verificationLink}" 
               style="background: #8b5cf6; color: white; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
              Verify and Login
            </a>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This link will expire in 15 minutes</p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">If the button doesn't work, copy and paste this link:</p>
            <p style="color: #8b5cf6; font-size: 11px; word-break: break-all;">${verificationLink}</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>If you didn't request this login verification, please ignore this email.</p>
            <p style="margin-top: 10px;">This is an automated message from Dunnis Stores.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: 'Verification link sent successfully',
      email 
    });

  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({ 
      error: 'Failed to send verification email. Please try again.' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Get stored verification data
    const verificationData = verificationTokens.get(token);

    if (!verificationData) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
    }

    // Check if token has expired
    if (Date.now() > verificationData.expires) {
      verificationTokens.delete(token);
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 });
    }

    // Check if token has already been used
    if (verificationData.used) {
      return NextResponse.json({ error: 'Verification link has already been used' }, { status: 400 });
    }

    // Mark token as used
    verificationData.used = true;
    verificationTokens.set(token, verificationData);

    return NextResponse.json({ 
      message: 'Email verified successfully',
      email: verificationData.email,
      verified: true 
    });

  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ 
      error: 'Failed to verify email. Please try again.' 
    }, { status: 500 });
  }
}
