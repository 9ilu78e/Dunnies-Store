import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth, unauthorizedResponse } from "@/lib/authMiddleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // For now, return empty comments without database
    // In production, you'd implement proper comments with MongoDB
    return NextResponse.json({
      comments: [],
      averageRating: 0,
      totalComments: 0,
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
