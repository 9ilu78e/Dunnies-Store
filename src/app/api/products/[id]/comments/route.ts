import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = await prisma.productComment.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating = 
      comments.length > 0
        ? Math.round((comments.reduce((sum: number, c: any) => sum + c.rating, 0) / comments.length) * 10) / 10
        : 0;

    return NextResponse.json({
      comments,
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
    const { id } = await params;
    const { userId, text, rating } = await request.json();

    if (!userId || !text || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: userId, text, rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
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

    const comment = await prisma.productComment.create({
      data: {
        productId: id,
        userId,
        text,
        rating,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
