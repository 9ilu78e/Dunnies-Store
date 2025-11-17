import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ cart: [] })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Item added to cart' }, { status: 201 })
}
