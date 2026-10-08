import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseAdminConfigurationError,
  getFirebaseAdminAuth,
} from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required from Google account" },
        { status: 400 }
      );
    }

    console.log("=== GOOGLE LOGIN ATTEMPT ===");
    console.log("UID:", uid);
    console.log("Email:", email);
    console.log("Name:", name);

    const user = await prisma.firebaseUser.upsert({
      where: { email },
      update: {
        uid,
        name: name || undefined,
        photo: picture || null,
        provider: "firebase",
      },
      create: {
        uid,
        email,
        name: name || email.split("@")[0],
        photo: picture || null,
        provider: "firebase",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        photo: user.photo,
        provider: user.provider,
        role: user.role,
      },
    });

    response.cookies.set("auth_token", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Firebase auth error:", error);

    if (error instanceof FirebaseAdminConfigurationError) {
      console.error(
        "Google sign-in is unavailable because Firebase Admin is not configured."
      );
      return NextResponse.json(
        {
          error:
            "Google sign-in is temporarily unavailable. Please use email sign-in or try again later.",
        },
        { status: 503 }
      );
    }

    if (error?.code === "app/invalid-credential") {
      return NextResponse.json(
        {
          error:
            "Google sign-in is temporarily unavailable. Please use email sign-in or try again later.",
        },
        { status: 503 }
      );
    }

    if (error?.code?.startsWith("P")) {
      return NextResponse.json(
        {
          error:
            "We couldn't finish setting up your account right now. Please try again shortly or use email sign-in.",
        },
        { status: 503 }
      );
    }

    if (error.code === "auth/argument-error") {
      return NextResponse.json(
        {
          error:
            "Google sign-in couldn't be completed. Please try again or use email sign-in.",
        },
        { status: 401 }
      );
    }

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        {
          error:
            "Your Google sign-in session expired. Please try signing in again.",
        },
        { status: 401 }
      );
    }

    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json(
        {
          error:
            "Your Google sign-in session is no longer valid. Please try signing in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Google sign-in couldn't be completed. Please try again or use email sign-in.",
      },
      { status: 500 }
    );
  }
}
