import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ orders: [] })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Order created' }, { status: 201 })
}
