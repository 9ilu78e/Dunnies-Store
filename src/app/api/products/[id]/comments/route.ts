import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth, unauthorizedResponse } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const comments = await prisma.productComment.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedComments = comments.map((comment) => ({
      ...comment,
      likeCount: comment.likes.length,
      isLiked: userId
        ? comment.likes.some((like) => like.userId === userId)
        : false,
      likes: undefined,
    }));
    const averageRating =
      comments.length > 0
        ? Math.round(
            (comments.reduce((total, comment) => total + comment.rating, 0) /
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
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      console.log('Comment API: User not authenticated');
      return unauthorizedResponse("You must be logged in to comment");
    }

    const { id } = await params;
    const { content, rating } = await request.json();

    console.log('Comment API: User authenticated:', auth.user.email);
    console.log('Comment data:', { content, rating });

    // For now, just return success without actual database operations
    // In production, you'd implement proper comments with MongoDB
    return NextResponse.json({
      id: Date.now().toString(),
      content,
      rating,
      user: {
        id: auth.user.id,
        fullName: auth.user.fullName,
      },
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      message: "Comment added successfully (temporary implementation)",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
