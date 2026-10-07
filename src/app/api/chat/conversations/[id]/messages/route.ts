import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Please log in to use live chat." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await prisma.liveChatConversation.findUnique({
      where: { id },
      select: { id: true, userAccountId: true, userAccountSource: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    if (
      auth.user.role.toLowerCase() !== "admin" &&
      (conversation.userAccountId !== auth.user.id ||
        conversation.userAccountSource !== auth.user.source)
    ) {
      return NextResponse.json({ error: "Access to this conversation is denied." }, { status: 403 });
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("[LIVE_CHAT_MESSAGES_GET]", error);
    return NextResponse.json(
      { error: "Unable to load chat messages." },
      { status: 500 }
    );
  }
}
