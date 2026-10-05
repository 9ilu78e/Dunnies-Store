ALTER TABLE "Order"
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pending';

CREATE TABLE "PaystackPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "reference" TEXT NOT NULL,
    "transactionId" TEXT,
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizationUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaystackPayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaystackPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PaystackPayment_orderId_key" ON "PaystackPayment"("orderId");
CREATE UNIQUE INDEX "PaystackPayment_reference_key" ON "PaystackPayment"("reference");
CREATE INDEX "PaystackPayment_status_createdAt_idx" ON "PaystackPayment"("status", "createdAt");
