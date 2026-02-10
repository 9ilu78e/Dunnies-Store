import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    console.log('=== EMAIL TEST ===');
    console.log('SMTP Username:', process.env.SMTP_USERNAME);
    console.log('SMTP Password exists:', !!process.env.SMTP_PASSWORD);
    console.log('Sender Email:', process.env.SENDER_EMAIL);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection verified!');

    const testEmail = {
      from: process.env.SENDER_EMAIL,
      to: 'toonm831@gmail.com',
      subject: 'Test Email - Dunnis Stores',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Dunnis Stores.</p>
        <p>If you receive this, email sending is working!</p>
      `,
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent!');
    console.log('Message ID:', result.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: result.messageId
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
