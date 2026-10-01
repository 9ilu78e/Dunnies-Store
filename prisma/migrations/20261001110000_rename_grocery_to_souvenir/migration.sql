ALTER TABLE "Grocery" RENAME TO "Souvenir";
ALTER TABLE "Souvenir" RENAME CONSTRAINT "Grocery_pkey" TO "Souvenir_pkey";
ALTER TABLE "Souvenir" RENAME CONSTRAINT "Grocery_categoryId_fkey" TO "Souvenir_categoryId_fkey";

UPDATE "Souvenir" AS item
SET "categoryId" = replacement."id"
FROM "Category" AS old_category
JOIN "Category" AS replacement
  ON replacement."name" = old_category."name"
 AND replacement."type" = 'souvenir'
WHERE old_category."type" = 'grocery'
  AND item."categoryId" = old_category."id";

UPDATE "Product" AS item
SET "categoryId" = replacement."id"
FROM "Category" AS old_category
JOIN "Category" AS replacement
  ON replacement."name" = old_category."name"
 AND replacement."type" = 'souvenir'
WHERE old_category."type" = 'grocery'
  AND item."categoryId" = old_category."id";

UPDATE "Gift" AS item
SET "categoryId" = replacement."id"
FROM "Category" AS old_category
JOIN "Category" AS replacement
  ON replacement."name" = old_category."name"
 AND replacement."type" = 'souvenir'
WHERE old_category."type" = 'grocery'
  AND item."categoryId" = old_category."id";

DELETE FROM "Category" AS old_category
USING "Category" AS replacement
WHERE old_category."type" = 'grocery'
  AND replacement."name" = old_category."name"
  AND replacement."type" = 'souvenir';

UPDATE "Category"
SET "type" = 'souvenir'
WHERE "type" = 'grocery';
