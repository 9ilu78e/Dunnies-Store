import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

const uploadFolders = new Set(["categories", "products", "gifts", "souvenirs"]);
const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedFolder = formData.get("folder");
    const folder =
      typeof requestedFolder === "string" ? requestedFolder : "products";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!uploadFolders.has(folder)) {
      return NextResponse.json(
        { error: "Invalid upload folder" },
        { status: 400 }
      );
    }

    if (!supportedImageTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are supported" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        },
        { status: 503 }
      );
    }

    const url = await uploadImage(file, folder);
    console.log(`[UPLOAD] File uploaded to Cloudinary: ${url}`);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("[UPLOAD]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
