import { PrismaClient } from '@prisma/client'
import { comparePasswords } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient()
  
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
