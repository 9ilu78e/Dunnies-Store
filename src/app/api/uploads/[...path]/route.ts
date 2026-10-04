import { join } from "path";
import { readFile, stat } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filepath = path.join("/");

    // Security: prevent directory traversal
    if (filepath.includes("..") || filepath.includes("//")) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // Try multiple possible locations
    const locations = [
      // Production Render location
      join(process.cwd(), '.uploads', filepath),
      // Local development location
      join(process.cwd(), 'public', 'uploads', filepath),
    ];

    let fileBuffer = null;
    let foundPath = null;

    for (const location of locations) {
      try {
        await stat(location);
        fileBuffer = await readFile(location);
        foundPath = location;
        break;
      } catch {
        // Try next location
        continue;
      }
    }

    if (!fileBuffer || !foundPath) {
      console.warn(`[UPLOADS_GET] File not found in any location: ${filepath}`);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    console.log(`[UPLOADS_GET] Serving file from: ${foundPath}`);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filepath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filepath.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (filepath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (filepath.endsWith('.avif')) {
      contentType = 'image/avif';
    }

    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return response;
  } catch (error) {
    console.error("[UPLOADS_GET]", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
