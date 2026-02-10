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

    // Upsert user in MongoDB
    const user = await FirebaseUser.findOneAndUpdate(
      { uid },
      {
        uid,
        email,
        name,
        photo: picture,
        provider: "firebase",
        role: "user", // Ensure default role
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        photo: user.photo,
        provider: user.provider
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
