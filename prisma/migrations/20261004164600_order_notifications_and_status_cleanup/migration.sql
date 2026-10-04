ALTER TABLE "Order"
ADD COLUMN "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'pay-on-delivery';

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL DEFAULT 'user',
    "accountId" TEXT NOT NULL,
    "orderId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_recipientRole_accountId_isRead_idx"
ON "Notification"("recipientRole", "accountId", "isRead");

CREATE INDEX "Notification_orderId_idx"
ON "Notification"("orderId");

UPDATE "Order"
SET "status" = 'processing'
WHERE "status" = 'shipped';
