import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<SiteSettings[]>`
      SELECT "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
             "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages"
      FROM "SiteSettings"
      WHERE "id" = 'main'
      LIMIT 1
    `;
    const settings = rows[0];
    return NextResponse.json(settings ?? DEFAULT_SITE_SETTINGS, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[SITE_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Unable to load website settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || auth.user?.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as Partial<SiteSettings>;
    const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
    const headerSubtitle =
      typeof body.headerSubtitle === "string" ? body.headerSubtitle.trim() : "";
    const headerLogo =
      typeof body.headerLogo === "string" ? body.headerLogo.trim() : "";
    const headerTitleColor =
      typeof body.headerTitleColor === "string" ? body.headerTitleColor.trim() : "";
    const headerSubtitleColor =
      typeof body.headerSubtitleColor === "string"
        ? body.headerSubtitleColor.trim()
        : "";
    const supportEmail =
      typeof body.supportEmail === "string" ? body.supportEmail.trim() : "";
    const supportPhone =
      typeof body.supportPhone === "string" ? body.supportPhone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const heroImages = body.heroImages;

    if (
      !storeName ||
      storeName.length > 120 ||
      headerSubtitle.length > 80 ||
      headerLogo.length > 2048 ||
      (headerLogo !== "" &&
        !(
          headerLogo.startsWith("/") ||
          headerLogo.startsWith("https://")
        )) ||
      !/^#[0-9a-fA-F]{6}$/.test(headerTitleColor) ||
      !/^#[0-9a-fA-F]{6}$/.test(headerSubtitleColor) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ||
      supportEmail.length > 254 ||
      !supportPhone ||
      supportPhone.length > 40 ||
      address.length > 240 ||
      !Array.isArray(heroImages) ||
      heroImages.length > 12 ||
      !heroImages.every(
        (image) =>
          typeof image === "string" &&
          image.length <= 2048 &&
          (image.startsWith("/") || image.startsWith("https://"))
      )
    ) {
      return NextResponse.json(
        { error: "Enter valid website details and up to 12 valid hero image URLs." },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<SiteSettings[]>`
      INSERT INTO "SiteSettings"
        ("id", "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
         "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages", "updatedAt")
      VALUES
        ('main', ${storeName}, ${headerSubtitle}, ${headerLogo}, ${headerTitleColor},
         ${headerSubtitleColor}, ${supportEmail}, ${supportPhone}, ${address}, ${heroImages}::text[], CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET
        "storeName" = EXCLUDED."storeName",
        "headerSubtitle" = EXCLUDED."headerSubtitle",
        "headerLogo" = EXCLUDED."headerLogo",
        "headerTitleColor" = EXCLUDED."headerTitleColor",
        "headerSubtitleColor" = EXCLUDED."headerSubtitleColor",
        "supportEmail" = EXCLUDED."supportEmail",
        "supportPhone" = EXCLUDED."supportPhone",
        "address" = EXCLUDED."address",
        "heroImages" = EXCLUDED."heroImages",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
                "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages"
    `;
    const settings = rows[0];

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SITE_SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Unable to save website settings." },
      { status: 500 }
    );
  }
}
