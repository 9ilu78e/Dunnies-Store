import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BrevoEmailError, sendBrevoEmail } from "@/lib/brevoEmail";

// Generate verification token
const generateVerificationToken = (): string => {
  return randomBytes(32).toString("base64url");
};

const hashVerificationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("=== EMAIL VERIFICATION REQUEST ===");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!process.env.BREVO_API_KEY?.trim() || !process.env.SENDER_EMAIL?.trim()) {
      console.error(
        "Email verification is unavailable because Brevo API configuration is incomplete."
      );
      return NextResponse.json(
        {
          error:
            "Email login is not configured. Set BREVO_API_KEY and SENDER_EMAIL in your Render service environment, then redeploy.",
        },
        { status: 503 }
      );
    }

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const frontendUrl = process.env.FRONTEND_URL || request.nextUrl.origin;
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    await prisma.emailLoginToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    const storedToken = await prisma.emailLoginToken.create({
      data: {
        tokenHash: hashVerificationToken(token),
        email,
        expiresAt,
      },
    });

    // Send email
    console.log("=== SENDING EMAIL ===");
    const mailOptions = {
      subject: "Your Dunnis Stores sign-in link",
      text: `Use this link to sign in to Dunnis Stores:\n\n${verificationLink}\n\nThis link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your Dunnis Stores sign-in link</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: Arial, Helvetica, sans-serif;">
          <!-- Preheader (hidden preview text) -->
          <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f4f4f5;">
            Tap the button to sign in to Dunnis Stores. This link expires in 15 minutes.
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5; padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                  <!-- Top promo bar -->
                  <tr>
                    <td align="center" style="background-color:#111827; color:#ffffff; font-size:12px; letter-spacing:1px; padding:10px 16px; text-transform:uppercase;">
                      Fresh deals every day &nbsp;•&nbsp; Shop with confidence
                    </td>
                  </tr>

                  <!-- Header / Logo -->
                  <tr>
                    <td align="center" style="padding:32px 24px 8px 24px;">
                      <div style="font-size:28px; font-weight:800; letter-spacing:1px; color:#111827;">
                        DUNNIS <span style="color:#8b5cf6;">STORES</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Hero -->
                  <tr>
                    <td align="center" style="padding:16px 32px 0 32px;">
                      <div style="width:64px; height:64px; line-height:64px; border-radius:50%; background-color:#f5f3ff; font-size:30px; margin:0 auto 16px auto;">
                        🛍️
                      </div>
                      <h1 style="margin:0 0 12px 0; font-size:26px; line-height:1.3; color:#111827;">
                        Welcome back! Let's get you signed in
                      </h1>
                      <p style="margin:0; font-size:15px; line-height:1.6; color:#4b5563;">
                        Tap the button below to securely sign in to your Dunnis Stores account and continue shopping.
                      </p>
                    </td>
                  </tr>

                  <!-- CTA Button -->
                  <tr>
                    <td align="center" style="padding:28px 32px 8px 32px;">
                      <a href="${verificationLink}"
                         style="display:inline-block; background-color:#8b5cf6; background-image:linear-gradient(90deg,#8b5cf6,#ec4899); color:#ffffff; text-decoration:none; font-size:16px; font-weight:bold; padding:16px 40px; border-radius:8px;">
                        Sign in to Dunnis Stores
                      </a>
                    </td>
                  </tr>

                  <!-- Expiry notice -->
                  <tr>
                    <td align="center" style="padding:12px 32px 24px 32px;">
                      <p style="margin:0; font-size:13px; color:#6b7280;">
                        ⏱️ This link expires in <strong>15 minutes</strong>.
                      </p>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding:0 32px;">
                      <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;" />
                    </td>
                  </tr>

                  <!-- Fallback link -->
                  <tr>
                    <td style="padding:16px 32px 8px 32px;">
                      <p style="margin:0 0 6px 0; font-size:12px; color:#6b7280;">
                        Button not working? Copy and paste this link into your browser:
                      </p>
                      <p style="margin:0; font-size:12px; word-break:break-all;">
                        <a href="${verificationLink}" style="color:#8b5cf6; text-decoration:underline;">${verificationLink}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Security note -->
                  <tr>
                    <td style="padding:16px 32px 32px 32px;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
                        If you didn't request this email, you can safely ignore it. Someone may have entered your email address by mistake.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="background-color:#111827; padding:24px 24px;">
                      <p style="margin:0 0 6px 0; font-size:14px; font-weight:bold; color:#ffffff; letter-spacing:1px;">
                        DUNNIS STORES
                      </p>
                      <p style="margin:0; font-size:12px; color:#9ca3af;">
                        &copy; ${new Date().getFullYear()} Dunnis Stores. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      `,
    };

    console.log("Mail options prepared:");
    console.log("Subject: Your Dunnis Stores sign-in link");

    try {
      const messageId = await sendBrevoEmail({
        to: email,
        ...mailOptions,
      });
      console.log("Login link email sent through Brevo API:", messageId);
      return NextResponse.json({
        message: "Verification link sent successfully",
        email,
      });
    } catch (sendError) {
      await prisma.emailLoginToken.delete({ where: { id: storedToken.id } });
      if (sendError instanceof BrevoEmailError) {
        console.error("Brevo rejected the sign-in email:", {
          status: sendError.status,
          code: sendError.providerCode,
        });
      } else {
        console.error("Failed to send sign-in email through Brevo:", sendError);
      }
      return NextResponse.json(
        {
          error:
            "The email provider could not send the sign-in link. Check BREVO_API_KEY and confirm SENDER_EMAIL is verified in Brevo.",
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error("Error sending verification email:", error);
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (errorCode === "P2021" || errorCode === "P2022") {
      return NextResponse.json(
        {
          error:
            "The sign-in database is missing required tables. Apply the latest database migrations, then try again.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Unable to create the sign-in link because the database is unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const tokenHash = hashVerificationToken(token);
    const verificationData = await prisma.emailLoginToken.findUnique({
      where: { tokenHash },
    });

    if (!verificationData) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      );
    }

    const consumedToken = await prisma.emailLoginToken.deleteMany({
      where: {
        id: verificationData.id,
        expiresAt: { gt: new Date() },
      },
    });
    if (consumedToken.count === 0) {
      await prisma.emailLoginToken.deleteMany({
        where: { id: verificationData.id },
      });
      return NextResponse.json(
        { error: "Verification link has expired" },
        { status: 400 }
      );
    }

    const user = await prisma.firebaseUser.upsert({
      where: { email: verificationData.email },
      update: {},
      create: {
        email: verificationData.email,
        name: verificationData.email.split("@")[0],
        provider: "email",
      },
    });

    // Create response with user data and cookies
    const response = NextResponse.json({
      message: "Email verified successfully",
      email: verificationData.email,
      verified: true,
      user: user,
    });

    // Set email verification cookie
    response.cookies.set("email_verified", verificationData.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Set user ID cookie
    response.cookies.set("userId", user.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      {
        error: "Failed to verify email. Please try again.",
      },
      { status: 500 }
    );
  }
}
