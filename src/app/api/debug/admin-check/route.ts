import { NextRequest, NextResponse } from 'next/server';
import connectDB from "@/lib/mongodb";
import FirebaseUser from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    
    // Find your specific user
    const user = await FirebaseUser.findOne({ 
      email: "toonm831@gmail.com" 
    });
    
    console.log('=== USER DEBUG ===');
    console.log('User found:', user);
    console.log('User role:', user?.role);
    
    return NextResponse.json({
      success: true,
      user: user,
      role: user?.role,
      message: `User role is: ${user?.role}`
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
