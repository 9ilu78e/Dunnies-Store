import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const souvenirs = await prisma.souvenir.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch all comments and likes for these souvenirs
    const souvenirIds = souvenirs.map((g: any) => g.id);
    const allComments = await prisma.productComment.findMany({
      where: { productId: { in: souvenirIds } },
    });
    const allLikes = await prisma.productLike.findMany({
      where: { productId: { in: souvenirIds } },
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

    const souvenirsWithProcessedImages = souvenirs.map((souvenir: any) => {
      const souvenirComments = commentsMap.get(souvenir.id) || [];
      const souvenirLikes = likesMap.get(souvenir.id) || [];

      // Map imageUrls array to image (first) and images (all)
      const imageUrls = Array.isArray(souvenir.imageUrls) && souvenir.imageUrls.length > 0
        ? souvenir.imageUrls
        : (souvenir.imageUrl && typeof souvenir.imageUrl === 'string')
        ? [souvenir.imageUrl]
        : [];

      // Calculate average rating
      const ratings = (souvenirComments as any[]).map((c: any) => c.rating);
      const averageRating = ratings.length > 0 
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

      return {
        ...souvenir,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || souvenir.imageUrl || "",
        averageRating,
        totalComments: souvenirComments.length,
        totalLikes: souvenirLikes.length,
      };
    });

    return NextResponse.json({ souvenirs: souvenirsWithProcessedImages }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("[SOUVENIRS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch souvenirs" },
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
    } = body;

    const parsedPrice = Number(price);
    const parsedStockQuantity = Number(stockQuantity ?? 0);
    const parsedFlashSalePrice =
      flashSalePrice === "" || flashSalePrice === null || flashSalePrice === undefined
        ? null
        : Number(flashSalePrice);
    const parsedFlashSaleEndsAt = flashSaleEndsAt
      ? new Date(flashSaleEndsAt)
      : null;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      !Number.isSafeInteger(parsedStockQuantity) ||
      parsedStockQuantity < 0 ||
      (parsedFlashSalePrice === null && !!flashSaleEndsAt) ||
      (parsedFlashSalePrice !== null &&
        (!Number.isFinite(parsedFlashSalePrice) ||
          parsedFlashSalePrice <= 0 ||
          parsedFlashSalePrice >= parsedPrice ||
          !parsedFlashSaleEndsAt ||
          Number.isNaN(parsedFlashSaleEndsAt.getTime()) ||
          parsedFlashSaleEndsAt.getTime() <= Date.now())) ||
      (flashSaleEndsAt &&
        (!parsedFlashSaleEndsAt || Number.isNaN(parsedFlashSaleEndsAt.getTime())))
    ) {
      return NextResponse.json(
        { error: "Enter a name, valid price, non-negative stock, and valid flash sale details" },
        { status: 400 }
      );
    }

    const souvenirData: any = {
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      price: parsedPrice,
      stockQuantity: parsedStockQuantity,
      priority: typeof priority === "string" ? priority : "normal",
      flashSalePrice: parsedFlashSalePrice,
      flashSaleEndsAt: parsedFlashSalePrice ? parsedFlashSaleEndsAt : null,
    };

    // Handle imageUrls array from frontend
    if (imageUrls && Array.isArray(imageUrls)) {
      souvenirData.imageUrls = imageUrls;
      souvenirData.imageUrl = imageUrls[0] || imageUrl || null;
    } else if (imageUrl && String(imageUrl).trim()) {
      souvenirData.imageUrl = imageUrl;
      souvenirData.imageUrls = [imageUrl];
    }

    if (categoryId && String(categoryId).trim() && String(categoryId) !== "null") {
      souvenirData.categoryId = categoryId;
    }

    const souvenir = await prisma.souvenir.create({
      data: souvenirData,
    });

    return NextResponse.json({ souvenir }, { status: 201 });
  } catch (error) {
    console.error("[SOUVENIRS_POST]", error);
    return NextResponse.json(
      { error: "Unable to create souvenir" },
      { status: 500 }
    );
  }
}
