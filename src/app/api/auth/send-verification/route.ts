import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BrevoEmailError, sendBrevoEmail } from "@/lib/brevoEmail";
import { createLoginLinkEmail } from "@/lib/emails/loginEmail";

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
            "Email sign-in is temporarily unavailable. Please use Google sign-in or try again later.",
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
    const mailOptions = createLoginLinkEmail(verificationLink);

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
            "We couldn't send a sign-in link to that email address. Check the address and try again, or use Google sign-in.",
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
            "Email sign-in is temporarily unavailable. Please use Google sign-in or try again later.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error:
          "We couldn't start email sign-in right now. Please try again shortly or use Google sign-in.",
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
