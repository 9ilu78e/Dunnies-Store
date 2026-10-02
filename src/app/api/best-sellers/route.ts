import { NextRequest, NextResponse } from "next/server";
import { getBestSellers } from "@/lib/bestSellers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL for this service." },
      { status: 503 }
    );
  }

  try {
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit"));
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 18;
    const products = await getBestSellers(limit);

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (error) {
    console.error("[BEST_SELLERS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch best sellers" },
      { status: 500 }
    );
  }
}
