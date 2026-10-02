import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyUserAuth } from "@/lib/authMiddleware";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getLikeCount(productId: string) {
  const [userLikes, firebaseLikes] = await Promise.all([
    prisma.productLike.count({ where: { productId } }),
    prisma.firebaseProductLike.count({ where: { productId } }),
  ]);

  return userLikes + firebaseLikes;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await verifyUserAuth(request);
    const likeCount = await getLikeCount(id);
    let isLikedByUser = false;

    if (auth.user) {
      const firebaseUser = await prisma.firebaseUser.findUnique({
        where: { uid: auth.user.id },
      });

      if (firebaseUser) {
        isLikedByUser = Boolean(
          await prisma.firebaseProductLike.findUnique({
            where: {
              productId_userUid: { productId: id, userUid: firebaseUser.uid },
            },
          })
        );
      } else {
        isLikedByUser = Boolean(
          await prisma.productLike.findUnique({
            where: {
              productId_userId: { productId: id, userId: auth.user.id },
            },
          })
        );
      }
    }

    return NextResponse.json({ likeCount, isLikedByUser });
  } catch (error) {
    console.error("[PRODUCT_LIKES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse("You must be logged in to like products");
    }

    if (auth.user.role === "admin") {
      return NextResponse.json(
        { error: "Admin users cannot like products" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const firebaseUser = await prisma.firebaseUser.findUnique({
      where: { uid: auth.user.id },
    });

    let liked: boolean;
    if (firebaseUser) {
      const existingLike = await prisma.firebaseProductLike.findUnique({
        where: {
          productId_userUid: { productId: id, userUid: firebaseUser.uid },
        },
      });

      if (existingLike) {
        await prisma.firebaseProductLike.delete({
          where: { id: existingLike.id },
        });
        liked = false;
      } else {
        await prisma.firebaseProductLike.create({
          data: { productId: id, userUid: firebaseUser.uid },
        });
        liked = true;
      }
    } else {
      const account = await prisma.user.findUnique({
        where: { id: auth.user.id },
      });
      if (!account) {
        return unauthorizedResponse("Your account could not be found");
      }

      const existingLike = await prisma.productLike.findUnique({
        where: {
          productId_userId: { productId: id, userId: account.id },
        },
      });

      if (existingLike) {
        await prisma.productLike.delete({
          where: { id: existingLike.id },
        });
        liked = false;
      } else {
        await prisma.productLike.create({
          data: { productId: id, userId: account.id },
        });
        liked = true;
      }
    }

    return NextResponse.json({ liked, likeCount: await getLikeCount(id) });
  } catch (error) {
    console.error("[PRODUCT_LIKES_POST]", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
