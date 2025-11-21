import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/uploadHandler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");

    const where: any = {};
    if (priority) where.priority = priority;

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ categories });
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
        image: formData.get("image"),
      };
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const { name, description, priority, image } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    let imageUrl: string | null = null;

    // Handle image upload if provided
    if (image && typeof image !== "string") {
      try {
        imageUrl = await saveUploadedFile(image as File, "categories");
      } catch (uploadError) {
        console.error("[CATEGORY_IMAGE_UPLOAD]", uploadError);
        // Continue without image if upload fails
        imageUrl = null;
      }
    }

    const categoryData: any = {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
    };

    // Only include priority if it's provided
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
