import { prisma } from '@/lib/prisma'
import { comparePasswords } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not configured')
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Add timeout for database query (10 seconds)
    let user: any = null
    try {
      const userPromise = prisma.user.findUnique({
        where: { email },
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )

      user = await Promise.race([userPromise, timeoutPromise]) as any
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database connection timeout. Please try again.' },
          { status: 503 }
        )
      }
      throw error
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isPasswordValid = await comparePasswords(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Login error:', errorMessage, error)
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
