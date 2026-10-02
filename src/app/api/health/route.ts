import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "connected",
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("[HEALTH_DATABASE_CHECK]", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Database connection failed",
        hint: "Check DATABASE_URL and confirm the production database is reachable.",
      },
      { status: 500 }
    );
  }
}
