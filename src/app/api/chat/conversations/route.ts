import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Please log in to use live chat." }, { status: 401 });
    }

    const isAdmin = auth.user.role.toLowerCase() === "admin";
    if (isAdmin) {
      const conversations = await prisma.liveChatConversation.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      return NextResponse.json({ conversations });
    }

    const conversations = await prisma.liveChatConversation.findMany({
      where: {
        userAccountId: auth.user.id,
        userAccountSource: auth.user.source,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[LIVE_CHAT_CONVERSATIONS_GET]", error);
    return NextResponse.json(
      { error: "Unable to load live chat conversations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Please log in to use live chat." }, { status: 401 });
    }
    if (auth.user.role.toLowerCase() === "admin") {
      return NextResponse.json(
        { error: "Admins cannot start customer conversations." },
        { status: 403 }
      );
    }

    const existing = await prisma.liveChatConversation.findFirst({
      where: {
        userAccountId: auth.user.id,
        userAccountSource: auth.user.source,
        status: "open",
      },
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return NextResponse.json({ conversation: existing });

    const conversation = await prisma.liveChatConversation.create({
      data: {
        userAccountSource: auth.user.source,
        userAccountId: auth.user.id,
        userName: auth.user.fullName,
        userEmail: auth.user.email,
      },
    });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[LIVE_CHAT_CONVERSATIONS_POST]", error);
    return NextResponse.json(
      { error: "Unable to start a live chat conversation." },
      { status: 500 }
    );
  }
}
