import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function saveUploadedFile(
  file: File | Blob,
  folder: string
): Promise<string> {
  try {
    const extension = imageExtensions[file.type];
    if (!extension) {
      throw new Error("Only JPEG, PNG, GIF, WebP, and AVIF images are supported");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseDir =
      process.env.NODE_ENV === "production"
        ? join(process.cwd(), ".uploads")
        : join(process.cwd(), "public", "uploads");

    const uploadDir = join(baseDir, folder);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return `/api/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
}
