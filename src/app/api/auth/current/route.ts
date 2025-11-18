import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as TokenPayload;

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const firstName = user.fullName?.split(" ")[0] || user.fullName;

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Current user error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

