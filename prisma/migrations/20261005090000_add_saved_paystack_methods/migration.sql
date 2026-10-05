ALTER TABLE "PaystackPayment"
ADD COLUMN "savePaymentMethod" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PaystackPayment"
ADD COLUMN "savedMethodChargeAttemptedAt" TIMESTAMP(3);

CREATE TABLE "SavedPaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorizationCodeEncrypted" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "brand" TEXT,
    "cardType" TEXT,
    "last4" TEXT NOT NULL,
    "expMonth" TEXT NOT NULL,
    "expYear" TEXT NOT NULL,
    "bank" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedPaymentMethod_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SavedPaymentMethod_userId_signature_key"
ON "SavedPaymentMethod"("userId", "signature");
CREATE INDEX "SavedPaymentMethod_userId_isDefault_idx"
ON "SavedPaymentMethod"("userId", "isDefault");
