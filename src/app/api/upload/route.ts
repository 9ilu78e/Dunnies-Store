import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { verifyUserAuth } from "@/lib/authMiddleware";

const uploadFolders = new Set([
  "categories",
  "products",
  "gifts",
  "souvenirs",
  "hero",
  "branding",
]);
const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);
const svgType = "image/svg+xml";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || auth.user?.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

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

    const isSvg = file.type === svgType;
    if (!supportedImageTypes.has(file.type) && !(isSvg && folder === "hero")) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, WebP, and AVIF images are supported. SVG is supported for hero slides." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    let uploadFile = file;
    if (isSvg) {
      let svg = await file.text();
      const standardSvgDoctype =
        /<!DOCTYPE\s+svg\s+PUBLIC\s+["']-\/\/W3C\/\/DTD SVG 1\.[01]\/\/EN["']\s+["']https?:\/\/www\.w3\.org\/Graphics\/SVG\/1\.[01]\/DTD\/svg1[01]\.dtd["'](?:\s*\[[\s\S]*?\])?\s*>/gi;
      svg = svg.replace(standardSvgDoctype, "");
      const unsafeSvgContent =
        /<!DOCTYPE|<!ENTITY|<\s*script\b|<\s*foreignObject\b|\bon[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|javascript:|data:(?!image\/(?:png|jpe?g|gif|webp);base64,))|url\(\s*["']?\s*(?:https?:|javascript:|data:(?!image\/(?:png|jpe?g|gif|webp);base64,))|@import/i;
      if (
        !/<svg(?:\s|>)/i.test(svg) ||
        unsafeSvgContent.test(svg)
      ) {
        return NextResponse.json(
          { error: "The SVG contains unsupported or unsafe content." },
          { status: 400 }
        );
      }
      uploadFile = new File([svg], file.name, {
        type: svgType,
        lastModified: file.lastModified,
      });
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

    const url = await uploadImage(uploadFile, folder);
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
