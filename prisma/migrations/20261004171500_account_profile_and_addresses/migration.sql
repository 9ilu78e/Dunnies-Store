ALTER TABLE "User"
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "gender" TEXT,
ADD COLUMN "notificationPreferences" JSONB NOT NULL DEFAULT '{"orderUpdates":true,"promotions":true,"newsletter":false,"smsNotifications":true}',
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'WAT';

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

ALTER TABLE "Address"
ADD CONSTRAINT "Address_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
