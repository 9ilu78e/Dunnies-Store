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

    // Connect to MongoDB
    let user;
    try {
      await connectDB();

      console.log('✅ MongoDB connected, checking database...');

      // First check if user exists
      const existingUser = await FirebaseUser.findOne({ uid });
      console.log('Existing user found:', existingUser);
      
      if (existingUser) {
        console.log('Existing user role from database:', existingUser.role);
      }

      // If user exists, preserve their role, otherwise create new user with "user" role
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
        // Create new user - check if admin by email
        const newRole = isAdminByEmail ? 'admin' : 'user';
        console.log('Creating new user with role:', newRole, '(based on email check)');
        
        user = new FirebaseUser({
          uid,
          email,
          name,
          photo: picture,
          provider: "firebase",
          role: newRole
        });
        await user.save();
        console.log('Created new user with role:', user.role);
      }

      console.log('✅ Database operation successful');
      console.log('Final user role from database:', user.role);
    } catch (dbError: any) {
      console.error('❌ Database connection failed for Google auth, using fallback:', dbError.message);
      
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
