import { NextRequest, NextResponse } from "next/server";
import { verifyUserAuth, unauthorizedResponse } from "@/lib/authMiddleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // For now, return basic like count without database
    // In production, you'd implement a proper likes system with MongoDB
    return NextResponse.json({
      likeCount: 0,
      isLikedByUser: false,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      console.log('Like API: User not authenticated');
      return unauthorizedResponse("You must be logged in to like products");
    }

    console.log('Like API: User authenticated:', auth.user.email);
    const { id } = await params;

    // For now, just return success without actual database operations
    // In production, you'd implement proper likes with MongoDB
    return NextResponse.json({
      liked: true,
      likeCount: 1,
      message: "Product liked successfully (temporary implementation)",
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
