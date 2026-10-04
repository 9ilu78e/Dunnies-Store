import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAccountUser } from "@/lib/accountUser";
import { verifyUserAuth } from "@/lib/authMiddleware";

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
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const fullName = [body.firstName, body.lastName]
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.trim())
      .filter(Boolean)
      .join(" ");
    if (!fullName || fullName.length > 120) {
      return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    }
    if (
      body.phone !== undefined &&
      body.phone !== null &&
      (typeof body.phone !== "string" || body.phone.length > 40)
    ) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const dateOfBirth =
      typeof body.dateOfBirth === "string" && body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : null;
    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
    }
    if (
      body.gender !== undefined &&
      !["Male", "Female", "Other", "Prefer not to say"].includes(body.gender)
    ) {
      return NextResponse.json({ error: "Choose a valid gender." }, { status: 400 });
    }

    const account = await getOrCreateAccountUser(auth.user);
    const updatedUser = await prisma.user.update({
      where: { id: account.id },
      data: {
        fullName,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        dateOfBirth,
        gender: body.gender || "Prefer not to say",
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
    await prisma.firebaseUser.updateMany({
      where: { email: { equals: auth.user.email, mode: "insensitive" } },
      data: { name: updatedUser.fullName },
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