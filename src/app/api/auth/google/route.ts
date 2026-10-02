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

    console.log('=== GOOGLE LOGIN ATTEMPT ===');
    console.log('UID:', uid);
    console.log('Email:', email);
    console.log('Name:', name);

    // Check if this is a known admin email (fallback for when DB is down)
    const knownAdminEmails = [
      'toonm831@gmail.com',
      // Add other admin emails here
    ];
    
    const isAdminByEmail = knownAdminEmails.includes(email);
    console.log('Is admin by email check:', isAdminByEmail);
    console.log('Admin dashboard path: /dashboard');

    let user;
    try {
      user = await prisma.firebaseUser.upsert({
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
          role: isAdminByEmail ? "admin" : "user",
        },
      });

      console.log('✅ Database operation successful');
      console.log('Final user role from database:', user.role);
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('❌ Database connection failed for Google auth, using fallback:', errorMessage);
      
      // Create fallback user data - use admin role if email matches known admin
      const fallbackRole = isAdminByEmail ? 'admin' : 'user';
      console.log('Using fallback user data with role:', fallbackRole, '(based on email check)');
      
      user = {
        uid,
        email,
        name,
        photo: picture,
        provider: "firebase",
        role: fallbackRole
      };
      console.log('Final fallback user role:', user.role);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        photo: user.photo,
        provider: user.provider,
        role: user.role
      }
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
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    
    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: "Invalid ID token format" },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: "ID token has expired" },
        { status: 401 }
      );
    }

    if (error.code === 'auth/id-token-revoked') {
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
