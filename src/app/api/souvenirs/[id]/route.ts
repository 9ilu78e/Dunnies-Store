import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const souvenir = await prisma.souvenir.findUnique({
      where: { id },
    });

    if (!souvenir) {
      return NextResponse.json(
        { error: "Souvenir not found" },
        { status: 404 }
      );
    }

    // Fetch comments and likes separately
    const comments = await prisma.productComment.findMany({
      where: { productId: id },
    });
    const likes = await prisma.productLike.findMany({
      where: { productId: id },
    });

    const ratings = (comments as any[]).map((c: any) => c.rating);
    const averageRating = ratings.length > 0 
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    // Map imageUrls array to image (first) and images (all)
    const imageUrls = Array.isArray(souvenir.imageUrls) && souvenir.imageUrls.length > 0
      ? souvenir.imageUrls
      : (souvenir.imageUrl && typeof souvenir.imageUrl === 'string')
      ? [souvenir.imageUrl]
      : [];

    return NextResponse.json({ 
      souvenir: {
        ...souvenir,
        image: imageUrls[0] || "",
        images: imageUrls,
        imageUrl: imageUrls[0] || souvenir.imageUrl || "",
        averageRating,
        totalComments: comments.length,
        totalLikes: likes.length,
      }
    });
  } catch (error) {
    console.error("[SOUVENIRS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch souvenir" },
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
    const existing = await prisma.souvenir.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Souvenir not found" }, { status: 404 });
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
        images: formData.getAll("images"),
      };
    } else {
      body = await request.json();
    }

    const { name, description, price, imageUrl, images } = body;
    const parsedPrice =
      typeof price === "string" ? parseFloat(price) : Number(price);

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (!Number.isNaN(parsedPrice)) updateData.price = parsedPrice;

    if (images && Array.isArray(images) && images.length > 0) {
      const processedImages: string[] = [];
      for (const image of images) {
        if (image instanceof File) {
          const uploadedUrl = await saveUploadedFile(image, "souvenirs");
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
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const souvenir = await prisma.souvenir.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ souvenir });
  } catch (error) {
    console.error("[SOUVENIRS_PUT]", error);
    return NextResponse.json(
      { error: "Unable to update souvenir" },
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

    const souvenir = await prisma.souvenir.delete({
      where: { id },
    });

    return NextResponse.json({ souvenir });
  } catch (error) {
    console.error("[SOUVENIRS_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to delete souvenir" },
      { status: 500 }
    );
  }
}
