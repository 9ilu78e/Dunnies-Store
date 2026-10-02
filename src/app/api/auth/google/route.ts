import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
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

    if (
      error instanceof Error &&
      error.message.startsWith("Firebase Admin is not configured.")
    ) {
      return NextResponse.json(
        {
          error:
            "Google sign-in is not configured on the server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in the Render service environment, then redeploy.",
        },
        { status: 503 }
      );
    }

    if (error?.code === "app/invalid-credential") {
      return NextResponse.json(
        {
          error:
            "Google sign-in server credentials were rejected. Check that the Firebase service account belongs to the configured Firebase project.",
        },
        { status: 503 }
      );
    }

    if (error?.code?.startsWith("P")) {
      return NextResponse.json(
        {
          error:
            "Google sign-in could not save your account. Check the production database connection and migrations.",
        },
        { status: 503 }
      );
    }

    if (error.code === "auth/argument-error") {
      return NextResponse.json(
        { error: "Invalid ID token format" },
        { status: 400 }
      );
    }

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json(
        { error: "ID token has expired" },
        { status: 401 }
      );
    }

    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json(
        { error: "ID token has been revoked" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
