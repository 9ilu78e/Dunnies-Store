import { NextRequest, NextResponse } from 'next/server';
import connectDB from "@/lib/mongodb";
import FirebaseUser from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectDB();

    // Find or create user with email
    let user = await FirebaseUser.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new FirebaseUser({
        email,
        name: email.split('@')[0], // Use email prefix as name
        provider: "email",
        role: "user", // Default role
        uid: `email_${Date.now()}`, // Generate unique ID
      });
      await user.save();
    }

    // Set session cookie for email verified user
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

    // Set email verification cookie
    response.cookies.set('email_verified', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Set user ID in localStorage equivalent cookie
    response.cookies.set('userId', user.uid, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log('Email login successful for:', user.email);
    console.log('User role:', user.role);
    console.log('User UID:', user.uid);

    return response;

  } catch (error: any) {
    console.error('Email verification login error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete login. Please try again.' 
    }, { status: 500 });
  }
}
