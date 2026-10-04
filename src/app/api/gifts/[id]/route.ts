import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadHandler";
import { totalVariantStock, validateSizeVariants } from "@/lib/sizeVariants";
import {
  readGiftIncludedProducts,
  validateGiftIncludedProducts,
} from "@/lib/giftContents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gift = await prisma.gift.findUnique({
      where: { id },
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    // Fetch comments and likes separately
    const comments = await prisma.productComment.findMany({
      where: { productId: id },
    });
    const likes = await prisma.productLike.findMany({
      where: { productId: id },
    });

    const ratings = (comments as any[]).map((c: any) => c.rating);
    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length) *
              10
          ) / 10
        : 0;

    // Map imageUrls array to image (first) and images (all)
    const imageUrls =
      Array.isArray(gift.imageUrls) && gift.imageUrls.length > 0
        ? gift.imageUrls
        : gift.imageUrl && typeof gift.imageUrl === "string"
        ? [gift.imageUrl]
        : [];

    return NextResponse.json({
      gift: {
        ...gift,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || gift.imageUrl || "",
        averageRating,
        totalComments: comments.length,
        totalLikes: likes.length,
      },
    });
  } catch (error) {
    console.error("[GIFTS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch gift" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.gift.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type");
    let body: any = {};

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        imageUrl: formData.get("imageUrl"),
        categoryId: formData.get("categoryId"),
        stockQuantity: formData.get("stockQuantity"),
        priority: formData.get("priority"),
        flashSalePrice: formData.get("flashSalePrice"),
        flashSaleEndsAt: formData.get("flashSaleEndsAt"),
        images: formData.getAll("images"),
      };
    } else {
      body = await request.json();
    }

    const {
      name,
      description,
      price,
      imageUrl,
      categoryId,
      stockQuantity,
      priority,
      flashSalePrice,
      flashSaleEndsAt,
      imageUrls,
      images,
      sizeVariants,
      includedProducts,
      extraPrice,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (Array.isArray(imageUrls)) {
      if (
        !imageUrls.every(
          (url: unknown) => typeof url === "string" && url.trim().length > 0
        )
      ) {
        return NextResponse.json(
          { error: "Image URLs must be a list of non-empty strings" },
          { status: 400 }
        );
      }
      const processedImageUrls = imageUrls.map((url: string) => url.trim());
      updateData.imageUrls = processedImageUrls;
      updateData.imageUrl = processedImageUrls[0] || null;
    }
    if (price !== undefined && price !== "") {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { error: "Price must be greater than zero" },
          { status: 400 }
        );
      }
      updateData.price = parsedPrice;
    }
    if (extraPrice !== undefined && extraPrice !== "") {
      const parsedExtraPrice = Number(extraPrice);
      if (!Number.isFinite(parsedExtraPrice) || parsedExtraPrice < 0) {
        return NextResponse.json(
          { error: "Extra price must be a non-negative amount" },
          { status: 400 }
        );
      }
      updateData.extraPrice = parsedExtraPrice;
    }
    if (stockQuantity !== undefined && stockQuantity !== "") {
      const parsedStockQuantity = Number(stockQuantity);
      if (
        !Number.isSafeInteger(parsedStockQuantity) ||
        parsedStockQuantity < 0
      ) {
        return NextResponse.json(
          { error: "Stock quantity must be a non-negative whole number" },
          { status: 400 }
        );
      }
      updateData.stockQuantity = parsedStockQuantity;
    }
    if (sizeVariants !== undefined) {
      const validation = validateSizeVariants(sizeVariants);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      updateData.sizeVariants = validation.variants;
      if (validation.variants.length > 0) {
        updateData.stockQuantity = totalVariantStock(validation.variants);
      }
    }
    if (includedProducts !== undefined || extraPrice !== undefined) {
      const contentsToPrice =
        includedProducts !== undefined
          ? includedProducts
          : readGiftIncludedProducts(existing.includedProducts);
      const validation = validateGiftIncludedProducts(contentsToPrice);
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
      if (includedProducts !== undefined) {
        updateData.includedProducts = validation.contents;
      }
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
      const extra = Number(updateData.extraPrice ?? existing.extraPrice ?? 0);
      updateData.price = includedPrice + extra;
      if (Number(updateData.price) <= 0) {
        return NextResponse.json(
          { error: "Gift price must be greater than zero" },
          { status: 400 }
        );
      }
    }
    if (priority !== undefined) updateData.priority = priority || "normal";
    if (flashSalePrice !== undefined || flashSaleEndsAt !== undefined) {
      const rawFlashSalePrice = flashSalePrice ?? null;
      const parsedFlashSalePrice =
        rawFlashSalePrice === "" || rawFlashSalePrice === null
          ? null
          : Number(rawFlashSalePrice);
      const parsedFlashSaleEndsAt = flashSaleEndsAt
        ? new Date(flashSaleEndsAt)
        : null;
      const updatedBasePrice =
        typeof updateData.price === "number"
          ? updateData.price
          : existing.price;
      if (
        parsedFlashSalePrice !== null &&
        (!Number.isFinite(parsedFlashSalePrice) ||
          parsedFlashSalePrice <= 0 ||
          parsedFlashSalePrice >= updatedBasePrice ||
          !parsedFlashSaleEndsAt ||
          Number.isNaN(parsedFlashSaleEndsAt.getTime()) ||
          parsedFlashSaleEndsAt.getTime() <= Date.now())
      ) {
        return NextResponse.json(
          {
            error:
              "Flash sale price must be greater than zero and less than the regular price",
          },
          { status: 400 }
        );
      }
      if (
        flashSaleEndsAt &&
        (!parsedFlashSaleEndsAt ||
          Number.isNaN(parsedFlashSaleEndsAt.getTime()))
      ) {
        return NextResponse.json(
          { error: "Flash sale end time is invalid" },
          { status: 400 }
        );
      }
      if (!parsedFlashSalePrice && flashSaleEndsAt) {
        return NextResponse.json(
          { error: "A flash sale end time requires a flash sale price" },
          { status: 400 }
        );
      }
      updateData.flashSalePrice = parsedFlashSalePrice;
      updateData.flashSaleEndsAt = parsedFlashSalePrice
        ? parsedFlashSaleEndsAt
        : null;
    }

    if (images && Array.isArray(images) && images.length > 0) {
      const processedImages: string[] = [];
      for (const image of images) {
        if (image instanceof File) {
          const uploadedUrl = await saveUploadedFile(image, "gifts");
          if (uploadedUrl) {
            processedImages.push(uploadedUrl);
          }
        }
      }
      if (processedImages.length > 0) {
        updateData.imageUrls = processedImages;
        // Update imageUrl to first image
        updateData.imageUrl = processedImages[0];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const gift = await prisma.gift.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ gift });
  } catch (error) {
    console.error("[GIFTS_PUT]", error);
    return NextResponse.json(
      { error: "Unable to update gift" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const gift = await prisma.gift.delete({
      where: { id },
    });

    return NextResponse.json({ gift });
  } catch (error) {
    console.error("[GIFTS_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to delete gift" },
      { status: 500 }
    );
  }
}
