import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient()
  
  try {
    const body = await request.json()
    const { fullName, email, phone, password } = body

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
