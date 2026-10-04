import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadHandler";
import { totalVariantStock, validateSizeVariants } from "@/lib/sizeVariants";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        comments: true,
        likes: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const ratings = (product.comments as any[]).map((c: any) => c.rating);
    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length) *
              10
          ) / 10
        : 0;

    // Map imageUrls array to image (first) and images (all)
    // Handle null imageUrl from existing products
    const imageUrls =
      Array.isArray(product.imageUrls) && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl && typeof product.imageUrl === "string"
        ? [product.imageUrl]
        : [];

    return NextResponse.json({
      product: {
        ...product,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || product.imageUrl || "",
        averageRating,
        totalComments: product.comments.length,
        totalLikes: product.likes.length,
      },
    });
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type");
    let body: any = {};

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        deliveryFee: formData.get("deliveryFee"),
        imageUrl: formData.get("imageUrl"),
        categoryId: formData.get("categoryId"),
        priority: formData.get("priority"),
        stockQuantity: formData.get("stockQuantity"),
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
      imageUrls,
      categoryId,
      priority,
      deliveryFee,
      stockQuantity,
      sizeVariants,
      images,
    } = body;
    const parsedPrice =
      typeof price === "string" ? parseFloat(price) : Number(price);

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (imageUrls !== undefined) {
      if (
        !Array.isArray(imageUrls) ||
        !imageUrls.every(
          (url) => typeof url === "string" && url.trim().length > 0
        )
      ) {
        return NextResponse.json(
          { error: "Image URLs must be a list of non-empty strings" },
          { status: 400 }
        );
      }

      const normalizedImageUrls: string[] = imageUrls.map((url: string) =>
        url.trim()
      );
      updateData.imageUrls = normalizedImageUrls;
      updateData.imageUrl = normalizedImageUrls[0] || null;
    } else if (typeof imageUrl === "string") {
      updateData.imageUrl = imageUrl.trim() || null;
      updateData.imageUrls = imageUrl.trim() ? [imageUrl.trim()] : [];
    }
    // Only update categoryId if it's a valid string value (not empty or "null")
    if (
      categoryId &&
      String(categoryId).trim() &&
      String(categoryId) !== "null"
    ) {
      updateData.categoryId = categoryId;
    }
    if (priority) updateData.priority = priority;
    if (!Number.isNaN(parsedPrice)) updateData.price = parsedPrice;
    if (
      deliveryFee !== undefined &&
      deliveryFee !== null &&
      deliveryFee !== ""
    ) {
      const parsedDeliveryFee = Number(deliveryFee);
      if (!Number.isFinite(parsedDeliveryFee) || parsedDeliveryFee < 0) {
        return NextResponse.json(
          { error: "Delivery fee must be a non-negative amount" },
          { status: 400 }
        );
      }
      updateData.deliveryFee = parsedDeliveryFee;
    }
    if (
      stockQuantity !== undefined &&
      stockQuantity !== null &&
      stockQuantity !== ""
    ) {
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

    if (images && Array.isArray(images) && images.length > 0) {
      const processedImages: string[] = [];
      for (const image of images) {
        if (image instanceof File) {
          const uploadedUrl = await saveUploadedFile(image, "products");
          if (uploadedUrl) {
            processedImages.push(uploadedUrl);
          }
        }
      }
      if (processedImages.length > 0) {
        const existingImageUrls = Array.isArray(updateData.imageUrls)
          ? updateData.imageUrls.filter(
              (url): url is string => typeof url === "string"
            )
          : [];
        const allImageUrls = [...existingImageUrls, ...processedImages];
        updateData.imageUrls = allImageUrls;
        updateData.imageUrl = allImageUrls[0] || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[PRODUCT_PUT]", error);
    return NextResponse.json(
      { error: "Unable to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to delete product" },
      { status: 500 }
    );
  }
}
