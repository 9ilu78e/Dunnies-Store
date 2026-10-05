export function createEmailVerificationCodeEmail(code: string): string {
  return `
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
  `;
}
