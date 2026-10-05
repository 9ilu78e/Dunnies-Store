CREATE TABLE IF NOT EXISTS "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "storeName" TEXT NOT NULL DEFAULT 'Dunnis Stores',
    "headerSubtitle" TEXT NOT NULL DEFAULT 'Premium Shopping',
    "headerLogo" TEXT NOT NULL DEFAULT '',
    "headerTitleColor" TEXT NOT NULL DEFAULT '#7c3aed',
    "headerSubtitleColor" TEXT NOT NULL DEFAULT '#6b7280',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@dunnistores.ng',
    "supportPhone" TEXT NOT NULL DEFAULT '+234 901 987 6543',
    "address" TEXT NOT NULL DEFAULT 'Garki, Abuja, Nigeria',
    "heroImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
