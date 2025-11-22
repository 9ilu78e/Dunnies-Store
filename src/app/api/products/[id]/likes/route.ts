import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const likeCount = await prisma.productLike.count({
      where: { productId: id },
    });

    let isLikedByUser = false;
    if (userId) {
      const userLike = await prisma.productLike.findUnique({
        where: {
          productId_userId: {
            productId: id,
            userId,
          },
        },
      });
      isLikedByUser = !!userLike;
    }

    return NextResponse.json({
      likeCount,
      isLikedByUser,
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
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Check if product exists in any table (Product, Gift, or Grocery)
    let product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      const gift = await prisma.gift.findUnique({ where: { id } });
      if (!gift) {
        const grocery = await prisma.grocery.findUnique({ where: { id } });
        if (!grocery) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }
      }
    }

    const existingLike = await prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId: id,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.productLike.delete({
        where: {
          productId_userId: {
            productId: id,
            userId,
          },
        },
      });

      const likeCount = await prisma.productLike.count({
        where: { productId: id },
      });

      return NextResponse.json({
        liked: false,
        likeCount,
      });
    } else {
      await prisma.productLike.create({
        data: {
          productId: id,
          userId,
        },
      });

      const likeCount = await prisma.productLike.count({
        where: { productId: id },
      });

      return NextResponse.json({
        liked: true,
        likeCount,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
