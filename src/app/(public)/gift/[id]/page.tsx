import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductDetailWrapper from "@/components/product/ProductDetailWrapper";
import { type ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";
import { readSizeVariants } from "@/lib/sizeVariants";
import { readGiftIncludedProducts } from "@/lib/giftContents";

type GiftDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getGiftFromDatabase(id: string) {
  try {
    const gift = await prisma.gift.findUnique({
      where: { id },
    });

    if (gift) {
      const includedProducts = readGiftIncludedProducts(gift.includedProducts);
      const includedProductsFromDatabase = includedProducts.length
        ? await prisma.product.findMany({
            where: {
              id: { in: includedProducts.map((item) => item.productId) },
            },
            select: {
              id: true,
              price: true,
              flashSalePrice: true,
              flashSaleEndsAt: true,
            },
          })
        : [];
      const includedProductPrice = includedProducts.reduce((total, content) => {
        const bundledProduct = includedProductsFromDatabase.find(
          (item) => item.id === content.productId
        );
        if (!bundledProduct) return total;
        const unitPrice =
          bundledProduct.flashSalePrice !== null &&
          bundledProduct.flashSaleEndsAt !== null &&
          bundledProduct.flashSaleEndsAt.getTime() > Date.now()
            ? bundledProduct.flashSalePrice
            : bundledProduct.price;
        return total + unitPrice * content.quantity;
      }, 0);

      // Fetch comments and likes separately
      const comments = await prisma.productComment.findMany({
        where: { productId: id },
      });
      const likes = await prisma.productLike.findMany({
        where: { productId: id },
      });

      return { ...gift, comments, likes, includedProductPrice };
    }

    return null;
  } catch (error) {
    return null;
  }
}

function transformDatabaseGift(dbGift: any): ProductRecord {
  console.log(
    `[GiftDetail] ${dbGift.name}: imageUrl="${dbGift.imageUrl}", imageUrls=${
      dbGift.imageUrls ? `[${dbGift.imageUrls.join(",")}]` : "[]"
    }`
  );

  // Calculate average rating from comments
  const ratings = (dbGift.comments as any[]).map((c: any) => c.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((a: number, b: number) => a + b, 0) /
            ratings.length) *
            10
        ) / 10
      : 0;

  // Prioritize imageUrls array first, then imageUrl, then unsplash default
  let imageUrls = [];
  if (
    dbGift.imageUrls &&
    Array.isArray(dbGift.imageUrls) &&
    dbGift.imageUrls.length > 0
  ) {
    imageUrls = dbGift.imageUrls.filter((url: string) => url && url.trim());
  }
  if (imageUrls.length === 0 && dbGift.imageUrl && dbGift.imageUrl.trim()) {
    imageUrls = [dbGift.imageUrl];
  }
  if (imageUrls.length === 0) {
    imageUrls = [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    ];
  }

  return {
    id: dbGift.id,
    name: dbGift.name,
    description: dbGift.description || "",
    longDescription: dbGift.description || "",
    price: readGiftIncludedProducts(dbGift.includedProducts).length
      ? dbGift.includedProductPrice
      : dbGift.flashSalePrice &&
          dbGift.flashSaleEndsAt &&
          new Date(dbGift.flashSaleEndsAt).getTime() > Date.now()
        ? dbGift.flashSalePrice
        : dbGift.price,
    originalPrice:
      !readGiftIncludedProducts(dbGift.includedProducts).length &&
      dbGift.flashSalePrice &&
      dbGift.flashSaleEndsAt &&
      new Date(dbGift.flashSaleEndsAt).getTime() > Date.now()
        ? dbGift.price
        : undefined,
    stockQuantity: dbGift.stockQuantity,
    sizeVariants: readSizeVariants(dbGift.sizeVariants),
    includedProducts: readGiftIncludedProducts(dbGift.includedProducts),
    rating: averageRating,
    reviewsCount: dbGift.comments.length,
    image: imageUrls[0],
    images: imageUrls,
    tag: "Gift",
    category: "Gifts",
    href: `/gift/${dbGift.id}`,
    stockStatus:
      dbGift.stockQuantity === 0
        ? ("out-of-stock" as const)
        : dbGift.stockQuantity <= 5
        ? ("low-stock" as const)
        : ("in-stock" as const),
    highlights: ["Premium quality", "Fast delivery", "Perfect gift"],
    specs: [
      { label: "SKU", value: dbGift.id },
      { label: "Category", value: "Gifts" },
    ],
    reviews: [],
  };
}

export default async function GiftDetailPage({ params }: GiftDetailPageProps) {
  const { id } = await params;

  let dbGift = await getGiftFromDatabase(id);
  let product: ProductRecord | null = null;

  if (dbGift) {
    product = transformDatabaseGift(dbGift);
  }

  if (!product) {
    return notFound();
  }

  return (
    <ProductDetailWrapper>
      <section className="bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ProductDetail product={product} itemType="gift" />
        </div>
      </section>
    </ProductDetailWrapper>
  );
}
