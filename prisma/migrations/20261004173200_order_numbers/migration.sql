CREATE SEQUENCE "Order_orderNumber_seq" START WITH 1;

ALTER TABLE "Order" ADD COLUMN "orderNumber" INTEGER;

WITH numbered_orders AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id")::INTEGER AS order_number
  FROM "Order"
)
UPDATE "Order"
SET "orderNumber" = numbered_orders.order_number
FROM numbered_orders
WHERE "Order"."id" = numbered_orders."id";

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET DEFAULT nextval('"Order_orderNumber_seq"');
ALTER SEQUENCE "Order_orderNumber_seq" OWNED BY "Order"."orderNumber";
SELECT setval('"Order_orderNumber_seq"', COALESCE((SELECT MAX("orderNumber") FROM "Order"), 0) + 1, false);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
