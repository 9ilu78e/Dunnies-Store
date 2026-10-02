import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyUserAuth } from "@/lib/authMiddleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse("You must be logged in to like comments");
    }
    if (auth.user.role === "admin") {
      return NextResponse.json(
        { error: "Admin users cannot like comments" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      commentId?: string;
      replyId?: string;
    };
    const { commentId, replyId } = body;
    if ((!commentId && !replyId) || (commentId && replyId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const firebaseUser = await prisma.firebaseUser.findUnique({
      where: { uid: auth.user.id },
    });
    const legacyUser = firebaseUser
      ? null
      : await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!firebaseUser && !legacyUser) {
      return unauthorizedResponse("Your account could not be found");
    }
    const identityFilter = firebaseUser
      ? { firebaseUserUid: firebaseUser.uid }
      : legacyUser
      ? { userId: legacyUser.id }
      : null;
    if (!identityFilter) {
      return unauthorizedResponse("Your account could not be found");
    }

    if (commentId) {
      const comment = await prisma.productComment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }
      const existingLike = await prisma.commentLike.findFirst({
        where: { ...identityFilter, commentId, replyId: null },
      });
      if (existingLike) {
        await prisma.commentLike.delete({ where: { id: existingLike.id } });
      } else {
        await prisma.commentLike.create({
          data: {
            userId: legacyUser?.id ?? null,
            firebaseUserUid: firebaseUser?.uid ?? null,
            commentId,
          },
        });
      }
      const likeCount = await prisma.commentLike.count({
        where: { commentId },
      });
      return NextResponse.json({ liked: !existingLike, likeCount });
    } else if (replyId) {
      const reply = await prisma.commentReply.findUnique({
        where: { id: replyId },
      });
      if (!reply) {
        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }
      const existingLike = await prisma.commentLike.findFirst({
        where: { ...identityFilter, replyId, commentId: null },
      });
      if (existingLike) {
        await prisma.commentLike.delete({ where: { id: existingLike.id } });
      } else {
        await prisma.commentLike.create({
          data: {
            userId: legacyUser?.id ?? null,
            firebaseUserUid: firebaseUser?.uid ?? null,
            replyId,
          },
        });
      }
      const likeCount = await prisma.commentLike.count({ where: { replyId } });
      return NextResponse.json({ liked: !existingLike, likeCount });
    }

    return NextResponse.json(
      { error: "Unable to process like" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[COMMENT_LIKE_POST]", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    );
  }
}
