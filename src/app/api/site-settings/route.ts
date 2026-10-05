import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";
import {
  DEFAULT_HERO_SLIDE,
  DEFAULT_SITE_SETTINGS,
  type HeroSlide,
  type SiteSettings,
} from "@/lib/siteSettings";

type SiteSettingsRow = Omit<SiteSettings, "heroSlides"> & {
  heroImages: string[];
  heroSlides: unknown;
};

function normalizeHeroSlides(
  value: unknown,
  legacyImages: string[] = []
): HeroSlide[] {
  if (Array.isArray(value)) {
    return value.flatMap((slide) => {
      if (
        typeof slide !== "object" ||
        slide === null ||
        Array.isArray(slide) ||
        typeof (slide as Record<string, unknown>).image !== "string"
      ) {
        return [];
      }
      const normalized = {
        ...DEFAULT_HERO_SLIDE,
        ...slide,
      } as HeroSlide;
      if (
        normalized.overlayOpacity === 0 &&
        normalized.titleColor.toLowerCase() === "#ffffff" &&
        normalized.subtitleColor.toLowerCase() === "#f3e8ff" &&
        normalized.descriptionColor.toLowerCase() === "#e5e7eb"
      ) {
        Object.assign(normalized, {
          titleColor: DEFAULT_HERO_SLIDE.titleColor,
          subtitleColor: DEFAULT_HERO_SLIDE.subtitleColor,
          descriptionColor: DEFAULT_HERO_SLIDE.descriptionColor,
          tagTextColor: DEFAULT_HERO_SLIDE.tagTextColor,
          tagBackgroundColor: DEFAULT_HERO_SLIDE.tagBackgroundColor,
          tagBackgroundOpacity: DEFAULT_HERO_SLIDE.tagBackgroundOpacity,
          primaryButtonBackgroundColor:
            DEFAULT_HERO_SLIDE.primaryButtonBackgroundColor,
          primaryButtonTextColor: DEFAULT_HERO_SLIDE.primaryButtonTextColor,
          secondaryButtonBackgroundColor:
            DEFAULT_HERO_SLIDE.secondaryButtonBackgroundColor,
          secondaryButtonBackgroundOpacity:
            DEFAULT_HERO_SLIDE.secondaryButtonBackgroundOpacity,
          secondaryButtonTextColor:
            DEFAULT_HERO_SLIDE.secondaryButtonTextColor,
          secondaryButtonBorderColor:
            DEFAULT_HERO_SLIDE.secondaryButtonBorderColor,
        });
      }
      return [normalized];
    });
  }
  return legacyImages.map((image) => ({ ...DEFAULT_HERO_SLIDE, image }));
}

function isSafeLocalPath(value: string) {
  return /^\/(?!\/)/.test(value);
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<SiteSettingsRow[]>`
      SELECT "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
             "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages", "heroSlides"
      FROM "SiteSettings"
      WHERE "id" = 'main'
      LIMIT 1
    `;
    const settings = rows[0];
    return NextResponse.json(
      settings
        ? {
            ...settings,
            heroSlides: normalizeHeroSlides(
              settings.heroSlides,
              settings.heroImages
            ),
          }
        : DEFAULT_SITE_SETTINGS,
      {
      headers: { "Cache-Control": "no-store" },
      }
    );
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
    const heroSlides = Array.isArray(body.heroSlides)
      ? normalizeHeroSlides(body.heroSlides)
      : body.heroSlides;
    const isValidHeroSlide = (slide: unknown): slide is HeroSlide => {
      if (typeof slide !== "object" || slide === null || Array.isArray(slide)) {
        return false;
      }
      const value = slide as Record<string, unknown>;
      const stringFields = [
        "image",
        "alt",
        "tag",
        "title",
        "subtitle",
        "description",
        "ctaText",
        "ctaHref",
        "secondaryCtaText",
        "secondaryCtaHref",
        "titleColor",
        "subtitleColor",
        "descriptionColor",
        "tagTextColor",
        "tagBackgroundColor",
        "primaryButtonBackgroundColor",
        "primaryButtonTextColor",
        "secondaryButtonBackgroundColor",
        "secondaryButtonTextColor",
        "secondaryButtonBorderColor",
        "textAlignment",
        "contentPosition",
        "imageFit",
        "heroHeight",
        "cornerRadius",
        "overlayColor",
      ] as const;
      if (
        !stringFields.every(
          (field) => typeof value[field] === "string"
        )
      ) {
        return false;
      }

      const image = value.image as string;
      const primaryHref = value.ctaHref as string;
      const secondaryHref = value.secondaryCtaHref as string;
      const colorFields = [
        "titleColor",
        "subtitleColor",
        "descriptionColor",
        "tagTextColor",
        "tagBackgroundColor",
        "primaryButtonBackgroundColor",
        "primaryButtonTextColor",
        "secondaryButtonBackgroundColor",
        "secondaryButtonTextColor",
        "secondaryButtonBorderColor",
        "overlayColor",
      ] as const;
      return (
        image.length <= 2048 &&
        (image.startsWith("https://") || isSafeLocalPath(image)) &&
        (primaryHref === "" || isSafeLocalPath(primaryHref)) &&
        (secondaryHref === "" || isSafeLocalPath(secondaryHref)) &&
        (value.alt as string).length <= 180 &&
        (value.tag as string).length <= 80 &&
        (value.title as string).length <= 160 &&
        (value.subtitle as string).length <= 200 &&
        (value.description as string).length <= 500 &&
        (value.ctaText as string).length <= 60 &&
        primaryHref.length <= 512 &&
        (value.secondaryCtaText as string).length <= 60 &&
        secondaryHref.length <= 512 &&
        colorFields.every((field) =>
          /^#[0-9a-fA-F]{6}$/.test(value[field] as string)
        ) &&
        typeof value.tagBackgroundOpacity === "number" &&
        value.tagBackgroundOpacity >= 0 &&
        value.tagBackgroundOpacity <= 1 &&
        typeof value.secondaryButtonBackgroundOpacity === "number" &&
        value.secondaryButtonBackgroundOpacity >= 0 &&
        value.secondaryButtonBackgroundOpacity <= 1 &&
        typeof value.overlayOpacity === "number" &&
        value.overlayOpacity >= 0 &&
        value.overlayOpacity <= 0.8 &&
        ["left", "center", "right"].includes(value.textAlignment as string) &&
        ["left", "center", "right"].includes(value.contentPosition as string) &&
        ["cover", "contain"].includes(value.imageFit as string) &&
        ["compact", "standard", "tall"].includes(value.heroHeight as string) &&
        ["none", "small", "medium"].includes(value.cornerRadius as string)
      );
    };

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
      !Array.isArray(heroSlides) ||
      heroSlides.length > 12 ||
      !heroSlides.every(isValidHeroSlide)
    ) {
      return NextResponse.json(
        { error: "Enter valid website details and up to 12 valid hero image URLs." },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<SiteSettingsRow[]>`
      INSERT INTO "SiteSettings"
        ("id", "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
         "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages", "heroSlides", "updatedAt")
      VALUES
        ('main', ${storeName}, ${headerSubtitle}, ${headerLogo}, ${headerTitleColor},
         ${headerSubtitleColor}, ${supportEmail}, ${supportPhone}, ${address},
         ${heroSlides.map((slide) => slide.image)}::text[], ${JSON.stringify(heroSlides)}::jsonb, CURRENT_TIMESTAMP)
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
        "heroSlides" = EXCLUDED."heroSlides",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "storeName", "headerSubtitle", "headerLogo", "headerTitleColor",
                "headerSubtitleColor", "supportEmail", "supportPhone", "address", "heroImages", "heroSlides"
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
