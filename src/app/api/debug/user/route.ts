import { NextRequest, NextResponse } from 'next/server';
import connectDB from "@/lib/mongodb";
import FirebaseUser from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');
    
    console.log('=== DEBUG USER LOOKUP ===');
    console.log('UID param:', uid);
    console.log('Email param:', email);
    
    let user;
    if (uid) {
      user = await FirebaseUser.findOne({ uid });
    } else if (email) {
      user = await FirebaseUser.findOne({ email });
    } else {
      // Get all users
      user = await FirebaseUser.find({});
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
