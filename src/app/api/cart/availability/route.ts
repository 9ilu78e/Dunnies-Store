import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { productIds?: unknown };
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0
        )
      : [];
    if (productIds.length === 0 || productIds.length > 100) {
      return NextResponse.json(
        { error: "Provide between 1 and 100 product IDs" },
        { status: 400 }
      );
    }

    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          price: true,
          stockQuantity: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.gift.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          price: true,
          stockQuantity: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.souvenir.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          price: true,
          stockQuantity: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
    ]);
    const now = Date.now();
    const inventory = [...products, ...gifts, ...souvenirs];
    return NextResponse.json({
      products: inventory.map((product) => ({
        id: product.id,
        stockQuantity: product.stockQuantity,
        price:
          product.flashSalePrice !== null &&
          product.flashSaleEndsAt !== null &&
          product.flashSaleEndsAt.getTime() > now
            ? product.flashSalePrice
            : product.price,
      })),
      missingIds: productIds.filter(
        (id) => !inventory.some((product) => product.id === id)
      ),
    });
  } catch (error) {
    console.error("[CART_AVAILABILITY_POST]", error);
    return NextResponse.json(
      { error: "Unable to check product availability" },
      { status: 500 }
    );
  }
}
