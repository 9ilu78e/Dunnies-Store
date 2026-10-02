import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CatalogItemType = "product" | "gift" | "souvenir";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      productIds?: unknown;
      items?: unknown;
    };
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0
        )
      : [];
    const requestedItems = Array.isArray(body.items)
      ? body.items.filter(
          (
            item
          ): item is { id: string; itemType: CatalogItemType } =>
            !!item &&
            typeof item.id === "string" &&
            item.id.length > 0 &&
            ["product", "gift", "souvenir"].includes(item.itemType)
        )
      : [];
    if (
      (productIds.length === 0 && requestedItems.length === 0) ||
      productIds.length > 100 ||
      requestedItems.length > 100 ||
      (Array.isArray(body.items) &&
        requestedItems.length !== body.items.length)
    ) {
      return NextResponse.json(
        { error: "Provide between 1 and 100 valid catalog item IDs" },
        { status: 400 }
      );
    }

    const allIds = [
      ...productIds,
      ...requestedItems.map((item) => item.id),
    ];
    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          price: true,
          stockQuantity: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.gift.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          price: true,
          stockQuantity: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.souvenir.findMany({
        where: { id: { in: allIds } },
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
    const inventory = [
      ...products.map((item) => ({ ...item, itemType: "product" as const })),
      ...gifts.map((item) => ({ ...item, itemType: "gift" as const })),
      ...souvenirs.map((item) => ({
        ...item,
        itemType: "souvenir" as const,
      })),
    ];
    const availableItems = requestedItems.flatMap((requested) => {
      const item = inventory.find(
        (candidate) =>
          candidate.id === requested.id &&
          candidate.itemType === requested.itemType
      );
      return item
        ? [
            {
              id: item.id,
              itemType: item.itemType,
              stockQuantity: item.stockQuantity,
              price:
                item.flashSalePrice !== null &&
                item.flashSaleEndsAt !== null &&
                item.flashSaleEndsAt.getTime() > now
                  ? item.flashSalePrice
                  : item.price,
            },
          ]
        : [];
    });

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
      items: availableItems,
      missingIds: productIds.filter(
        (id) => !inventory.some((product) => product.id === id)
      ),
      missingItems: requestedItems.filter(
        (requested) =>
          !availableItems.some(
            (item) =>
              item.id === requested.id &&
              item.itemType === requested.itemType
          )
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
