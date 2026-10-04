import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { totalVariantStock, validateSizeVariants } from "@/lib/sizeVariants";
import { validateGiftIncludedProducts } from "@/lib/giftContents";

export async function GET(request: NextRequest) {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch all comments and likes for these gifts
    const giftIds = gifts.map((g: any) => g.id);
    const allComments = await prisma.productComment.findMany({
      where: { productId: { in: giftIds } },
    });
    const allLikes = await prisma.productLike.findMany({
      where: { productId: { in: giftIds } },
    });

    // Create maps for efficient lookup
    const commentsMap = new Map<string, any[]>();
    const likesMap = new Map<string, any[]>();

    allComments.forEach((c: any) => {
      if (!commentsMap.has(c.productId)) commentsMap.set(c.productId, []);
      commentsMap.get(c.productId)!.push(c);
    });

    allLikes.forEach((l: any) => {
      if (!likesMap.has(l.productId)) likesMap.set(l.productId, []);
      likesMap.get(l.productId)!.push(l);
    });

    const giftsWithProcessedImages = gifts.map((gift: any) => {
      const giftComments = commentsMap.get(gift.id) || [];
      const giftLikes = likesMap.get(gift.id) || [];

      // Map imageUrls array to image (first) and images (all)
      const imageUrls =
        Array.isArray(gift.imageUrls) && gift.imageUrls.length > 0
          ? gift.imageUrls
          : gift.imageUrl && typeof gift.imageUrl === "string"
          ? [gift.imageUrl]
          : [];

      // Calculate average rating
      const ratings = (giftComments as any[]).map((c: any) => c.rating);
      const averageRating =
        ratings.length > 0
          ? Math.round(
              (ratings.reduce((a: number, b: number) => a + b, 0) /
                ratings.length) *
                10
            ) / 10
          : 0;

      return {
        ...gift,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || gift.imageUrl || "",
        averageRating,
        totalComments: giftComments.length,
        totalLikes: giftLikes.length,
      };
    });

    return NextResponse.json(
      { gifts: giftsWithProcessedImages },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("[GIFTS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch gifts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      imageUrl,
      imageUrls,
      categoryId,
      stockQuantity,
      priority,
      flashSalePrice,
      flashSaleEndsAt,
      sizeVariants,
      includedProducts,
      extraPrice,
    } = body;

    const parsedPrice = Number(price);
    const parsedExtraPrice = Number(extraPrice ?? 0);
    const parsedStockQuantity = Number(stockQuantity ?? 0);
    const parsedFlashSalePrice =
      flashSalePrice === "" ||
      flashSalePrice === null ||
      flashSalePrice === undefined
        ? null
        : Number(flashSalePrice);
    const parsedFlashSaleEndsAt = flashSaleEndsAt
      ? new Date(flashSaleEndsAt)
      : null;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      (includedProducts === undefined &&
        (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) ||
      !Number.isFinite(parsedExtraPrice) ||
      parsedExtraPrice < 0 ||
      !Number.isSafeInteger(parsedStockQuantity) ||
      parsedStockQuantity < 0 ||
      (parsedFlashSalePrice === null && !!flashSaleEndsAt) ||
      (parsedFlashSalePrice !== null &&
        (!Number.isFinite(parsedFlashSalePrice) ||
          parsedFlashSalePrice <= 0 ||
          !parsedFlashSaleEndsAt ||
          Number.isNaN(parsedFlashSaleEndsAt.getTime()) ||
          parsedFlashSaleEndsAt.getTime() <= Date.now())) ||
      (flashSaleEndsAt &&
        (!parsedFlashSaleEndsAt ||
          Number.isNaN(parsedFlashSaleEndsAt.getTime())))
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a name, valid price, non-negative stock, and valid flash sale details",
        },
        { status: 400 }
      );
    }

    const giftData: any = {
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      price: parsedPrice,
      extraPrice: parsedExtraPrice,
      stockQuantity: parsedStockQuantity,
      priority: typeof priority === "string" ? priority : "normal",
      flashSalePrice: parsedFlashSalePrice,
      flashSaleEndsAt: parsedFlashSalePrice ? parsedFlashSaleEndsAt : null,
    };

    if (includedProducts !== undefined) {
      const validation = validateGiftIncludedProducts(includedProducts);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const matchingProducts = await prisma.product.count({
        where: {
          id: { in: validation.contents.map((item) => item.productId) },
        },
      });
      if (matchingProducts !== validation.contents.length) {
        return NextResponse.json(
          { error: "One or more gift contents reference an unknown product" },
          { status: 400 }
        );
      }
      giftData.includedProducts = validation.contents;
      const products = await prisma.product.findMany({
        where: {
          id: { in: validation.contents.map((item) => item.productId) },
        },
        select: { id: true, price: true },
      });
      const includedPrice = validation.contents.reduce((total, content) => {
        const product = products.find((item) => item.id === content.productId);
        return total + (product?.price ?? 0) * content.quantity;
      }, 0);
      giftData.price = includedPrice + parsedExtraPrice;
      if (giftData.price <= 0) {
        return NextResponse.json(
          { error: "Gift price must be greater than zero" },
          { status: 400 }
        );
      }
    }
    if (
      parsedFlashSalePrice !== null &&
      parsedFlashSalePrice >= giftData.price
    ) {
      return NextResponse.json(
        {
          error:
            "Flash sale price must be greater than zero and less than the gift price",
        },
        { status: 400 }
      );
    }

    if (sizeVariants !== undefined) {
      const validation = validateSizeVariants(sizeVariants);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      giftData.sizeVariants = validation.variants;
      if (validation.variants.length > 0) {
        giftData.stockQuantity = totalVariantStock(validation.variants);
      }
    }

    // Handle imageUrls array from frontend
    if (imageUrls && Array.isArray(imageUrls)) {
      giftData.imageUrls = imageUrls;
      giftData.imageUrl = imageUrls[0] || imageUrl || null;
    } else if (imageUrl && String(imageUrl).trim()) {
      giftData.imageUrl = imageUrl;
      giftData.imageUrls = [imageUrl];
    }

    if (
      categoryId &&
      String(categoryId).trim() &&
      String(categoryId) !== "null"
    ) {
      giftData.categoryId = categoryId;
    }

    const gift = await prisma.gift.create({
      data: giftData,
    });

    return NextResponse.json({ gift }, { status: 201 });
  } catch (error) {
    console.error("[GIFTS_POST]", error);
    return NextResponse.json(
      { error: "Unable to create gift" },
      { status: 500 }
    );
  }
}
