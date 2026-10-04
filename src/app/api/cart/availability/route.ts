import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSizeVariants } from "@/lib/sizeVariants";
import type { GiftContentSelection } from "@/lib/giftContents";

type CatalogItemType = "product" | "gift" | "souvenir";
type RequestedItem = {
  id: string;
  itemType: CatalogItemType;
  size?: string;
  giftContents?: GiftContentSelection[];
};

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
          (item): item is RequestedItem =>
            !!item &&
            typeof item.id === "string" &&
            item.id.length > 0 &&
            ["product", "gift", "souvenir"].includes(item.itemType) &&
            (item.size === undefined ||
              (typeof item.size === "string" && item.size.trim().length > 0)) &&
            (item.giftContents === undefined ||
              (Array.isArray(item.giftContents) &&
                item.giftContents.length <= 30 &&
                item.giftContents.every(
                  (content: GiftContentSelection) =>
                    !!content &&
                    typeof content.productId === "string" &&
                    content.productId.length > 0 &&
                    Number.isSafeInteger(content.quantity) &&
                    content.quantity > 0 &&
                    (content.size === undefined ||
                      (typeof content.size === "string" &&
                        content.size.trim().length > 0))
                )))
        )
      : [];
    if (
      (productIds.length === 0 && requestedItems.length === 0) ||
      productIds.length > 100 ||
      requestedItems.length > 100 ||
      (Array.isArray(body.items) && requestedItems.length !== body.items.length)
    ) {
      return NextResponse.json(
        { error: "Provide between 1 and 100 valid catalog item IDs" },
        { status: 400 }
      );
    }

    const allIds = [
      ...productIds,
      ...requestedItems.map((item) => item.id),
      ...requestedItems.flatMap(
        (item) => item.giftContents?.map((content) => content.productId) ?? []
      ),
    ];
    const [products, gifts, souvenirs] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          name: true,
          price: true,
          deliveryFee: true,
          stockQuantity: true,
          sizeVariants: true,
          imageUrl: true,
          imageUrls: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.gift.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          price: true,
          deliveryFee: true,
          stockQuantity: true,
          sizeVariants: true,
          includedProducts: true,
          extraPrice: true,
          flashSalePrice: true,
          flashSaleEndsAt: true,
        },
      }),
      prisma.souvenir.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          price: true,
          deliveryFee: true,
          stockQuantity: true,
          sizeVariants: true,
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
      const variants = item ? readSizeVariants(item.sizeVariants) : [];
      const selectedSize = requested.size?.trim().toUpperCase();
      const selectedVariant = selectedSize
        ? variants.find(
            (variant) => variant.size.toUpperCase() === selectedSize
          )
        : undefined;
      if (!item) return [];

      const getPrice = (catalogItem: {
        price: number;
        flashSalePrice: number | null;
        flashSaleEndsAt: Date | null;
      }) =>
        catalogItem.flashSalePrice !== null &&
        catalogItem.flashSaleEndsAt !== null &&
        catalogItem.flashSaleEndsAt.getTime() > now
          ? catalogItem.flashSalePrice
          : catalogItem.price;
      const configuredContents =
        item.itemType === "gift" && "includedProducts" in item
          ? item.includedProducts
          : [];
      const selectedGiftContents: GiftContentSelection[] =
        requested.giftContents ??
        (Array.isArray(configuredContents)
          ? configuredContents.flatMap((content) =>
              content &&
              typeof content === "object" &&
              "productId" in content &&
              "quantity" in content &&
              typeof content.productId === "string" &&
              typeof content.quantity === "number"
                ? [
                    {
                      productId: content.productId,
                      quantity: content.quantity,
                    },
                  ]
                : []
            )
          : []);
      let bundlePrice =
        item.itemType === "gift" && "extraPrice" in item ? item.extraPrice : 0;
      let bundleStock = Number.MAX_SAFE_INTEGER;
      const normalizedGiftContents = [];
      if (item.itemType === "gift" && selectedGiftContents.length > 0) {
        for (const content of selectedGiftContents) {
          const bundledProduct = products.find(
            (candidate) => candidate.id === content.productId
          );
          if (!bundledProduct) {
            bundleStock = 0;
            continue;
          }
          const productVariants = readSizeVariants(bundledProduct.sizeVariants);
          const bundleSize = content.size?.trim().toUpperCase();
          const bundleVariant = bundleSize
            ? productVariants.find(
                (variant) => variant.size.toUpperCase() === bundleSize
              )
            : undefined;
          const productStock =
            productVariants.length > 0
              ? bundleVariant?.stockQuantity ?? 0
              : bundledProduct.stockQuantity;
          bundleStock = Math.min(
            bundleStock,
            Math.floor(productStock / content.quantity)
          );
          const unitPrice = getPrice(bundledProduct);
          bundlePrice += unitPrice * content.quantity;
          normalizedGiftContents.push({
            productId: bundledProduct.id,
            name: bundledProduct.name,
            image: bundledProduct.imageUrls[0] || bundledProduct.imageUrl || "",
            ...(bundleSize ? { size: bundleSize } : {}),
            quantity: content.quantity,
            price: unitPrice,
          });
        }
      }
      const baseStock = variants.length
        ? selectedVariant?.stockQuantity ?? 0
        : item.stockQuantity;
      const isConfiguredGift =
        item.itemType === "gift" &&
        ((Array.isArray(configuredContents) && configuredContents.length > 0) ||
          selectedGiftContents.length > 0);
      const itemPrice =
        item.itemType === "gift" && selectedGiftContents.length > 0
          ? bundlePrice
          : getPrice(item);
      const availableStock =
        item.itemType === "gift" && isConfiguredGift
          ? Math.min(baseStock, bundleStock)
          : baseStock;
      return [
        {
          id: item.id,
          itemType: item.itemType,
          ...(selectedSize ? { size: selectedSize } : {}),
          stockQuantity: availableStock,
          price: itemPrice,
          deliveryFee: item.deliveryFee,
          ...(item.itemType === "gift" && selectedGiftContents.length > 0
            ? { giftContents: normalizedGiftContents }
            : {}),
        },
      ];
    });

    return NextResponse.json({
      products: inventory.map((product) => ({
        id: product.id,
        stockQuantity: product.stockQuantity,
        deliveryFee: product.deliveryFee,
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
              item.id === requested.id && item.itemType === requested.itemType
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
