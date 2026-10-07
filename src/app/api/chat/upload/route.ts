import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadChatAudio, uploadImage } from "@/lib/cloudinary";
import { verifyUserAuth } from "@/lib/authMiddleware";

export const runtime = "nodejs";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const supportedAudioTypes = new Set([
  "audio/aac",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
]);
const supportedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: "Please log in to use live chat." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const conversationId = formData.get("conversationId");

    if (!(file instanceof File) || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "An attachment and conversation are required." },
        { status: 400 }
      );
    }

    const mimeType = file.type.split(";")[0].trim().toLowerCase();
    const isAudio = supportedAudioTypes.has(mimeType);
    const isImage = supportedImageTypes.has(mimeType);
    if (!isAudio && !isImage) {
      return NextResponse.json(
        { error: "Choose a supported image or audio file." },
        { status: 415 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "This attachment is empty." },
        { status: 400 }
      );
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { error: "Images and voice notes must be 10MB or smaller." },
        { status: 413 }
      );
    }

    const conversation = await prisma.liveChatConversation.findUnique({
      where: { id: conversationId },
      select: {
        userAccountId: true,
        userAccountSource: true,
        status: true,
      },
    });
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }
    if (
      auth.user.role.toLowerCase() !== "admin" &&
      (conversation.userAccountId !== auth.user.id ||
        conversation.userAccountSource !== auth.user.source)
    ) {
      return NextResponse.json(
        { error: "Access to this conversation is denied." },
        { status: 403 }
      );
    }
    if (conversation.status !== "open") {
      return NextResponse.json(
        { error: "This conversation is closed." },
        { status: 409 }
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Chat attachments are unavailable because Cloudinary is not configured.",
        },
        { status: 503 }
      );
    }

    const url = isAudio
      ? await uploadChatAudio(file)
      : await uploadImage(file, "dunnies-store/live-chat");
    return NextResponse.json({ url, kind: isAudio ? "audio" : "image" });
  } catch (error) {
    console.error("[LIVE_CHAT_AUDIO_UPLOAD]", error);
    return NextResponse.json(
      { error: "Unable to upload this chat attachment." },
      { status: 500 }
    );
  }
}
