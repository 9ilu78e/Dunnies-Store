import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");

    const where: any = { isActive: true };
    
    if (type) {
      where.type = type;
    }
    
    if (priority) {
      where.priority = priority;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedCategories = await Promise.all(
      categories.map(async (cat: any) => {
        let count = cat._count.products;

        if (cat.type === "gift") {
          const giftCount = await prisma.gift.count({
            where: { categoryId: cat.id },
          });
          count = giftCount;
        } else if (cat.type === "souvenir") {
          const souvenirCount = await prisma.souvenir.count({
            where: { categoryId: cat.id },
          });
          count = souvenirCount;
        }

        return {
          ...cat,
          _count: {
            products: count,
          },
        };
      })
    );

    const response = NextResponse.json({ categories: enrichedCategories });
    
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Last-Modified", new Date().toUTCString());
    response.headers.set("ETag", Date.now().toString());
    
    return response;
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, priority, type, imageUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Category image URL is required" },
        { status: 400 }
      );
    }

    const categoryType = type || "product";

    const existingCategory = await prisma.category.findUnique({
      where: { name_type: { name, type: categoryType } },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const categoryData: any = {
      name,
      type: categoryType,
      description: description || null,
      imageUrl: imageUrl || null,
    };

    if (priority) categoryData.priority = priority;

    const category = await prisma.category.create({
      data: categoryData,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[CATEGORIES_POST]", error);
    return NextResponse.json(
      { error: "Unable to create category" },
      { status: 500 }
    );
  }
}
