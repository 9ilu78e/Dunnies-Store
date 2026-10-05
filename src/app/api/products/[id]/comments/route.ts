import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyUserAuth } from "@/lib/authMiddleware";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await verifyUserAuth(request);
    const comments = await prisma.productComment.findMany({
      where: { productId: id },
      include: {
        user: { select: { id: true, fullName: true } },
        firebaseUser: { select: { uid: true, name: true } },
        likes: { select: { userId: true, firebaseUserUid: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      rating: comment.rating,
      createdAt: comment.createdAt,
      user: comment.firebaseUser
        ? { id: comment.firebaseUser.uid, fullName: comment.firebaseUser.name }
        : comment.user,
      likeCount: comment.likes.length,
      isLiked:
        !!auth.user &&
        comment.likes.some(
          (like) =>
            like.firebaseUserUid === auth.user?.id ||
            like.userId === auth.user?.id
        ),
    }));
    const averageRating =
      comments.length > 0
        ? Math.round(
            (comments.reduce((sum, comment) => sum + comment.rating, 0) /
              comments.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      comments: formattedComments,
      averageRating,
      totalComments: comments.length,
    });
  } catch (error) {
    console.error("[PRODUCT_COMMENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse("You must be logged in to comment");
    }
    if (auth.user.role === "admin") {
      return NextResponse.json(
        { error: "Admin users cannot comment on products" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      text?: unknown;
      content?: unknown;
      rating?: unknown;
    };
    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : typeof body.content === "string"
        ? body.content.trim()
        : "";
    const rating = Number(body.rating ?? 5);
    if (!text) {
      return NextResponse.json(
        { error: "Write a comment before posting" },
        { status: 400 }
      );
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Comments must be 2,000 characters or fewer" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

    const comment = await prisma.productComment.create({
      data: {
        productId: id,
        text,
        rating,
        userId: legacyUser?.id ?? null,
        firebaseUserUid: firebaseUser?.uid ?? null,
      },
      include: {
        user: { select: { id: true, fullName: true } },
        firebaseUser: { select: { uid: true, name: true } },
      },
    });
    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          text: comment.text,
          rating: comment.rating,
          createdAt: comment.createdAt,
          user: comment.firebaseUser
            ? {
                id: comment.firebaseUser.uid,
                fullName: comment.firebaseUser.name,
              }
            : comment.user,
          likeCount: 0,
          isLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PRODUCT_COMMENTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse("You must be logged in to manage comments.");
    }
    if (auth.user.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete product comments." },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    const body = (await request.json()) as { commentId?: unknown };
    if (typeof body.commentId !== "string" || !body.commentId.trim()) {
      return NextResponse.json(
        { error: "A valid comment ID is required." },
        { status: 400 }
      );
    }

    const comment = await prisma.productComment.findFirst({
      where: { id: body.commentId.trim(), productId },
      select: { id: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    await prisma.productComment.delete({ where: { id: comment.id } });
    return NextResponse.json({ message: "Comment deleted." });
  } catch (error) {
    console.error("[PRODUCT_COMMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to delete this comment." },
      { status: 500 }
    );
  }
}
