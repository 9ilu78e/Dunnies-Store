import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Prisma connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    // Try a simple query with timeout
    const result = await Promise.race([
      prisma.user.findFirst(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
      ),
    ])

    return NextResponse.json({
      status: 'connected',
      message: 'Database connection successful',
      result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Connection test failed:', errorMessage)
    
    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        hint: 'Check your MongoDB Atlas connection and IP whitelist',
      },
      { status: 500 }
    )
  }
}
