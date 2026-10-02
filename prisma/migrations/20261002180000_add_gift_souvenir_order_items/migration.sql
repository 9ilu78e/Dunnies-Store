ALTER TABLE "OrderItem"
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "OrderItem"
ADD COLUMN "giftId" TEXT,
ADD COLUMN "souvenirId" TEXT;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_giftId_fkey"
FOREIGN KEY ("giftId") REFERENCES "Gift"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "OrderItem_souvenirId_fkey"
FOREIGN KEY ("souvenirId") REFERENCES "Souvenir"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "OrderItem_one_catalog_item_check"
CHECK (num_nonnulls("productId", "giftId", "souvenirId") = 1);

CREATE INDEX "OrderItem_giftId_idx" ON "OrderItem"("giftId");
CREATE INDEX "OrderItem_souvenirId_idx" ON "OrderItem"("souvenirId");
