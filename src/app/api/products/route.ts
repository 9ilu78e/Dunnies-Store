import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");

    const where: any = {};
    if (priority) where.priority = priority;

    const products = await prisma.product.findMany({
      where,
      include: { 
        category: true,
        comments: true,
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Debug: Log first product to see structure
    if (products.length > 0) {
      console.log("[API] First product:", {
        id: products[0].id,
        name: products[0].name,
        imageUrl: products[0].imageUrl,
        imageUrls: products[0].imageUrls,
      });
    }

    const productsWithRatings = products.map((product: any) => {
      const ratings = product.comments.map((c: any) => c.rating);
      const averageRating = ratings.length > 0 
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

      // Map imageUrls array to image (first) and images (all)
      // Handle null imageUrl from existing products
      const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
        ? product.imageUrls
        : (product.imageUrl && typeof product.imageUrl === 'string')
        ? [product.imageUrl]
        : [];

      return {
        ...product,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || product.imageUrl || "",
        averageRating,
        totalComments: product.comments.length,
        totalLikes: product.likes.length,
      };
    });

    return NextResponse.json({ products: productsWithRatings }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch products" },
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
      priority,
      stockQuantity,
    } = body;

    if (!name || !description || !price) {
      return NextResponse.json(
        { error: "Name, description, and price are required" },
        { status: 400 }
      );
    }

    const parsedStockQuantity = Number(stockQuantity ?? 0);
    if (
      !Number.isSafeInteger(parsedStockQuantity) ||
      parsedStockQuantity < 0
    ) {
      return NextResponse.json(
        { error: "Stock quantity must be a non-negative whole number" },
        { status: 400 }
      );
    }

    const productData: any = {
      name,
      description,
      price: parseFloat(price),
      stockQuantity: parsedStockQuantity,
    };
    
    // Only include categoryId if it has a valid value
    if (categoryId && String(categoryId).trim() && String(categoryId) !== "null") {
      productData.categoryId = categoryId;
    }
    
    if (priority) productData.priority = priority;

    // Handle imageUrls array from frontend
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      productData.imageUrls = imageUrls;
      productData.imageUrl = imageUrls[0] || imageUrl;
    } else if (imageUrl && String(imageUrl).trim()) {
      productData.imageUrl = imageUrl;
      productData.imageUrls = [imageUrl];
    }

    const product = await prisma.product.create({
      data: productData,
      include: { category: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    return NextResponse.json(
      { error: "Unable to create product" },
      { status: 500 }
    );
  }
}
