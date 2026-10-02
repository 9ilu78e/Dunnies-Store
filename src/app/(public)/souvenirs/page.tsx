import type { Metadata } from "next";
import ProductsCatalog from "@/components/product/ProductsCatalog";
import { type ProductRecord } from "@/Data/products";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Souvenirs – Dunnis Stores",
  description: "Shop thoughtful souvenirs and keepsakes for every occasion",
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
    tag: tag ?? product.category ?? "Souvenir",
    category: product.category ?? "Souvenir",
    href: `/souvenirs/${product.id}`,
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

async function fetchSouvenirs(): Promise<ProductRecord[]> {
  try {
    const souvenirs = await prisma.souvenir.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    const comments = await prisma.productComment.findMany({
      where: { productId: { in: souvenirs.map((souvenir) => souvenir.id) } },
      select: { productId: true, rating: true },
    });
    const ratingsBySouvenir = new Map<string, number[]>();
    for (const comment of comments) {
      const ratings = ratingsBySouvenir.get(comment.productId) ?? [];
      ratings.push(comment.rating);
      ratingsBySouvenir.set(comment.productId, ratings);
    }

    return souvenirs.map((souvenir) => {
      const ratings = ratingsBySouvenir.get(souvenir.id) ?? [];
      return adaptProductRecord(
        {
          id: souvenir.id,
          name: souvenir.name,
          description: souvenir.description || "",
          price: souvenir.price,
          stockQuantity: souvenir.stockQuantity,
          flashSalePrice: souvenir.flashSalePrice,
          flashSaleEndsAt: souvenir.flashSaleEndsAt,
          rating:
            ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              : 0,
          reviewsCount: ratings.length,
          imageUrl: souvenir.imageUrl || "",
          imageUrls:
            souvenir.imageUrls && souvenir.imageUrls.length > 0
              ? souvenir.imageUrls
              : undefined,
          category: souvenir.category?.name || "Souvenir",
        },
        "Souvenir"
      );
    });
  } catch (error) {
    console.error("Failed to fetch souvenirs:", error);
    return [];
  }
}

export default async function SouvenirsPage() {
  const catalog = await fetchSouvenirs();

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Thoughtful Keepsakes
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            Souvenirs & Keepsakes
          </h1>
          <p className="text-slate-600 mt-2">
            Find meaningful mementos, locally inspired treasures, and memorable
            gifts to celebrate special moments.
          </p>
        </div>
        {catalog.length > 0 ? (
          <ProductsCatalog products={catalog} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No souvenirs available yet. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
