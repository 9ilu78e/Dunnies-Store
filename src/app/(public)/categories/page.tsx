import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight } from "lucide-react";
import Loader from "@/components/ui/Loader";

export const metadata: Metadata = {
  title: "All Categories – Dunnis Stores",
};

interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  type: string;
  _count?: {
    products: number;
  };
}

async function fetchAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    });

    const enrichedCategories: Category[] = [];

    for (const cat of categories) {
      let count = cat._count.products;

      if (cat.type === "gift") {
        count = await prisma.gift.count();
      } else if (cat.type === "grocery") {
        count = await prisma.grocery.count();
      }

      enrichedCategories.push({
        ...cat,
        _count: {
          products: count,
        },
      });
    }

    return enrichedCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await fetchAllCategories();

  // Group categories by type
  const productCategories = categories.filter((c) => c.type === "product");
  const giftCategories = categories.filter((c) => c.type === "gift");
  const groceryCategories = categories.filter((c) => c.type === "grocery");

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            All Categories
          </h1>
          <p className="text-slate-600 mt-2">
            Browse through our entire collection of product categories
          </p>
        </div>

        {/* Product Categories */}
        {productCategories.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Products</h2>
              <p className="text-gray-600 text-sm mt-1">
                Shop from our curated product selection
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/product?category=${cat.id}`}
                  className="group"
                >
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300 h-64 flex flex-col">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {cat.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-purple-200 text-sm font-semibold">
                          {cat._count?.products || 0} items
                        </p>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Gift Categories */}
        {giftCategories.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gifts</h2>
              <p className="text-gray-600 text-sm mt-1">
                Find the perfect gift for every occasion
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {giftCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/product?category=${cat.id}`}
                  className="group"
                >
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300 h-64 flex flex-col">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-pink-100 to-red-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {cat.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-red-200 text-sm font-semibold">
                          {cat._count?.products || 0} items
                        </p>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grocery Categories */}
        {groceryCategories.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Groceries</h2>
              <p className="text-gray-600 text-sm mt-1">
                Essential groceries delivered to your door
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groceryCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/product?category=${cat.id}`}
                  className="group"
                >
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300 h-64 flex flex-col">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {cat.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-green-200 text-sm font-semibold">
                          {cat._count?.products || 0} items
                        </p>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No categories available yet. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
