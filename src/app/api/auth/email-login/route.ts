import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.firebaseUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split('@')[0],
        provider: "email",
      },
    });

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
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Set user ID in localStorage equivalent cookie
    response.cookies.set('userId', user.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
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
