ALTER TABLE "Product"
ADD COLUMN "flashSalePrice" DOUBLE PRECISION,
ADD COLUMN "flashSaleEndsAt" TIMESTAMP(3);

CREATE TABLE "FirebaseProductLike" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirebaseProductLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FirebaseProductLike_productId_userUid_key"
ON "FirebaseProductLike"("productId", "userUid");

CREATE INDEX "FirebaseProductLike_productId_idx"
ON "FirebaseProductLike"("productId");

CREATE INDEX "FirebaseProductLike_userUid_idx"
ON "FirebaseProductLike"("userUid");

ALTER TABLE "FirebaseProductLike"
ADD CONSTRAINT "FirebaseProductLike_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FirebaseProductLike"
ADD CONSTRAINT "FirebaseProductLike_userUid_fkey"
FOREIGN KEY ("userUid") REFERENCES "FirebaseUser"("uid")
ON DELETE CASCADE ON UPDATE CASCADE;
