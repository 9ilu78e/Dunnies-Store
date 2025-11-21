import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function saveUploadedFile(
  file: File | Blob,
  folder: string
): Promise<string> {
  try {
    // Skip file system operations in production (Vercel, Netlify, etc.)
    if (process.env.NODE_ENV === "production") {
      // In production, return a placeholder or use a cloud service
      // For now, return a data URL as fallback
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      return `data:${file.type};base64,${base64.substring(0, 1000)}...`;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    // Handle both File and Blob objects
    const filename = `${timestamp}-${random}.${
      (file as File).name?.split(".").pop() || "jpg"
    }`;

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return relative path for database storage
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to save uploaded file");
  }
}
