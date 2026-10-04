ALTER TABLE "Order"
ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "Notification"
SET "link" = replace("link", '/admin/manage-orders', '/manage-orders')
WHERE "link" LIKE '/admin/manage-orders%';
