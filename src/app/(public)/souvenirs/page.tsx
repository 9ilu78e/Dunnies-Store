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
  imageUrl: string;
  imageUrls?: string[];
  category?: string | null;
};

const adaptProductRecord = (
  product: ApiProduct,
  tag?: string
): ProductRecord => {
  // Prioritize imageUrls array, fallback to imageUrl, then default
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
    price: product.price,
    originalPrice: undefined,
    rating: 0,
    reviewsCount: 0,
    image: imageUrls[0],
    images: imageUrls,
    tag: tag ?? product.category ?? "Souvenir",
    category: product.category ?? "Souvenir",
    href: `/souvenirs/${product.id}`,
    stockStatus: "in-stock",
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

    return souvenirs.map((souvenir: any) =>
      adaptProductRecord(
        {
          id: souvenir.id,
          name: souvenir.name,
          description: souvenir.description || "",
          price: souvenir.price,
          imageUrl: souvenir.imageUrl || "",
          imageUrls:
            souvenir.imageUrls && souvenir.imageUrls.length > 0
              ? souvenir.imageUrls
              : undefined,
          category: souvenir.category?.name || "Souvenir",
        },
        "Souvenir"
      )
    );
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
