import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

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
    const { fullName, email, phone, password } = body

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add timeout for database query (10 seconds)
    const existingUserPromise = prisma.user.findUnique({
      where: { email },
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    )

    const existingUser = await Promise.race([existingUserPromise, timeoutPromise])

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Register error:', errorMessage, error)

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
