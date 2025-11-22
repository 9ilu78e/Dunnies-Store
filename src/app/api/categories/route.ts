import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/uploadHandler";

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
      categories.map(async (cat) => {
        let count = cat._count.products;

        if (cat.type === "gift") {
          const giftCount = await prisma.gift.count({
            where: {},
          });
          count = giftCount;
        } else if (cat.type === "grocery") {
          const groceryCount = await prisma.grocery.count({
            where: {},
          });
          count = groceryCount;
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
    const contentType = request.headers.get("content-type");
    let body: any = {};

    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        name: formData.get("name"),
        description: formData.get("description"),
        priority: formData.get("priority"),
        type: formData.get("type"),
        image: formData.get("image"),
      };
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const { name, description, priority, type, image } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
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

    let imageUrl: string | null = null;

    if (image && typeof image !== "string") {
      try {
        imageUrl = await saveUploadedFile(image as File, "categories");
      } catch (uploadError) {
        console.error("[CATEGORY_IMAGE_UPLOAD]", uploadError);
        imageUrl = null;
      }
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
