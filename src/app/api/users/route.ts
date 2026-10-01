import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("count") === "true") {
      const result = await prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COUNT(DISTINCT LOWER(email))::int AS total
        FROM (
          SELECT email FROM "User"
          UNION ALL
          SELECT email FROM "FirebaseUser"
        ) AS all_users
      `;

      return NextResponse.json({ totalUsers: result[0]?.total ?? 0 });
    }

    const limitParam = searchParams.get("limit");
    const take = limitParam ? Math.min(Number(limitParam), 100) : 50;

    const users = await prisma.user.findMany({
      take: Number.isNaN(take) ? 50 : take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || request.cookies.get("userId")?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, dateOfBirth, gender } = body;

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        phone: phone || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USERS_PUT]", error);
    return NextResponse.json(
      { error: "Unable to update profile" },
      { status: 500 }
    );
  }
}