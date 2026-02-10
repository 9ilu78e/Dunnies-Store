import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import connectDB from "@/lib/mongodb";
import FirebaseUser from "@/models/User";

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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { uid, email, name, picture } = decodedToken;

    // Connect to MongoDB
    await connectDB();

    console.log('=== GOOGLE LOGIN ATTEMPT ===');
    console.log('UID:', uid);
    console.log('Email:', email);

    // First check if user exists
    const existingUser = await FirebaseUser.findOne({ uid });
    console.log('Existing user found:', existingUser);
    
    if (existingUser) {
      console.log('Existing user role:', existingUser.role);
    }

    // If user exists, preserve their role, otherwise create new user with "user" role
    let user;
    if (existingUser) {
      // Update existing user but preserve role
      user = await FirebaseUser.findOneAndUpdate(
        { uid },
        {
          email,
          name,
          photo: picture,
          provider: "firebase",
          updatedAt: new Date()
        },
        { new: true }
      );
      console.log('Updated existing user, role preserved:', user.role);
    } else {
      // Create new user with default "user" role
      user = new FirebaseUser({
        uid,
        email,
        name,
        photo: picture,
        provider: "firebase",
        role: "user"
      });
      await user.save();
      console.log('Created new user with role:', user.role);
    }

    console.log('User after update:', user);
    console.log('User role from database:', user.role);

    return NextResponse.json({
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

  } catch (error: any) {
    console.error("Firebase auth error:", error);
    
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
