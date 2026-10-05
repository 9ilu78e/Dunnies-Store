ALTER TABLE "SiteSettings"
ADD COLUMN "heroSlides" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "SiteSettings"
SET "heroSlides" = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'image', image,
        'alt', 'Dunnis Stores promotion',
        'tag', 'Welcome to Dunnis Stores',
        'title', 'Find something special',
        'subtitle', 'Thoughtful gifts, products, and souvenirs',
        'description', 'Explore our collection and discover something you will love.',
        'ctaText', 'Shop now',
        'ctaHref', '/product',
        'secondaryCtaText', 'Shop all',
        'secondaryCtaHref', '/product'
      ) ORDER BY legacy.ordinality
    ),
    '[]'::jsonb
  )
  FROM unnest("heroImages") WITH ORDINALITY AS legacy(image, ordinality)
)
WHERE cardinality("heroImages") > 0;
