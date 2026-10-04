ALTER TABLE "Product"
ADD COLUMN "sizeVariants" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "Gift"
ADD COLUMN "sizeVariants" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "Souvenir"
ADD COLUMN "sizeVariants" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "OrderItem"
ADD COLUMN "size" TEXT;

ALTER TABLE "Gift"
ADD COLUMN "includedProducts" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "OrderItem"
ADD COLUMN "giftContents" JSONB;
