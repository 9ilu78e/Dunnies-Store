import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/authMiddleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Please log in to use live chat." }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Live chat is unavailable because its signing secret is not configured." },
        { status: 503 }
      );
    }

    const ticket = jwt.sign(
      {
        purpose: "live-chat",
        accountId: auth.user.id,
        accountSource: auth.user.source,
        email: auth.user.email,
        name: auth.user.fullName,
        role: auth.user.role.toLowerCase() === "admin" ? "admin" : "user",
      },
      secret,
      { expiresIn: "2m", audience: "dunnies-live-chat", issuer: "dunnies-store" }
    );

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[LIVE_CHAT_SESSION_POST]", error);
    return NextResponse.json(
      { error: "Unable to start live chat." },
      { status: 500 }
    );
  }
}
