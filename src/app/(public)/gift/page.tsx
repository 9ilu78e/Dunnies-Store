import type { Metadata } from "next";
import ProductsCatalog from "@/components/product/ProductsCatalog";
import { type ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Gifts – Dunnis Stores",
  description: "Browse our collection of unique gift items for every occasion",
};

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity?: number;
  rating?: number;
  reviewsCount?: number;
  flashSalePrice?: number | null;
  flashSaleEndsAt?: Date | string | null;
  imageUrl: string;
  imageUrls?: string[];
  category?: string | null;
};

const adaptProductRecord = (
  product: ApiProduct,
  tag?: string
): ProductRecord => {
  const isFlashSaleActive =
    typeof product.flashSalePrice === "number" &&
    !!product.flashSaleEndsAt &&
    new Date(product.flashSaleEndsAt).getTime() > Date.now();
  const imageUrls =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
      ? [product.imageUrl]
      : [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        ];

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    longDescription: product.description,
    price: isFlashSaleActive ? product.flashSalePrice! : product.price,
    originalPrice: isFlashSaleActive ? product.price : undefined,
    stockQuantity: product.stockQuantity ?? 0,
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
    image: imageUrls[0],
    images: imageUrls,
    tag: tag ?? product.category ?? "Gift",
    category: product.category ?? "Gift",
    href: `/product/${product.id}`,
    stockStatus:
      !product.stockQuantity
        ? "out-of-stock"
        : product.stockQuantity <= 5
        ? "low-stock"
        : "in-stock",
    highlights: [],
    specs: [],
    reviews: [],
  };
};

async function fetchGifts(): Promise<ProductRecord[]> {
  try {
    const gifts = await prisma.gift.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    const comments = await prisma.productComment.findMany({
      where: { productId: { in: gifts.map((gift) => gift.id) } },
      select: { productId: true, rating: true },
    });
    const ratingsByGift = new Map<string, number[]>();
    for (const comment of comments) {
      const ratings = ratingsByGift.get(comment.productId) ?? [];
      ratings.push(comment.rating);
      ratingsByGift.set(comment.productId, ratings);
    }

    return gifts.map((gift) => {
      const ratings = ratingsByGift.get(gift.id) ?? [];
      return adaptProductRecord(
        {
          id: gift.id,
          name: gift.name,
          description: gift.description || "",
          price: gift.price,
          stockQuantity: gift.stockQuantity,
          flashSalePrice: gift.flashSalePrice,
          flashSaleEndsAt: gift.flashSaleEndsAt,
          rating:
            ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              : 0,
          reviewsCount: ratings.length,
          imageUrl: gift.imageUrl || "",
          imageUrls:
            gift.imageUrls && gift.imageUrls.length > 0
              ? gift.imageUrls
              : undefined,
          category: gift.category?.name || "Gift",
        },
        "Gift"
      );
    });
  } catch (error) {
    console.error("Failed to fetch gifts:", error);
    return [];
  }
}

export default async function GiftPage() {
  const catalog = await fetchGifts();

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Special Gifts
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            Thoughtful Gifts for Every Occasion
          </h1>
          <p className="text-slate-600 mt-2">
            Discover the perfect gift for your loved ones with our curated
            collection of unique and meaningful items.
          </p>
        </div>
        {catalog.length > 0 ? (
          <ProductsCatalog products={catalog} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No gifts available yet. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
