import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');
    
    console.log('=== DEBUG USER LOOKUP ===');
    console.log('UID param:', uid);
    console.log('Email param:', email);
    
    let user;
    if (uid) {
      user = await prisma.firebaseUser.findUnique({ where: { uid } });
    } else if (email) {
      user = await prisma.firebaseUser.findUnique({ where: { email } });
    } else {
      // Get all users
      user = await prisma.firebaseUser.findMany();
    }
    
    console.log('Found user(s):', user);
    
    return NextResponse.json({
      success: true,
      user: user,
      count: Array.isArray(user) ? user.length : (user ? 1 : 0)
    });
    
  } catch (error: any) {
    console.error('Debug lookup error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
