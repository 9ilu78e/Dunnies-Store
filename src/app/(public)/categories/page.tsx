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
      where: { isActive: true },
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

  const CategoryCard = ({ cat, colorAccent }: { cat: Category; colorAccent: string }) => (
    <Link href={`/product?category=${cat.id}`} className="group">
      <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
        {cat.imageUrl ? (
          <Image
            src={cat.imageUrl}
            alt={cat.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-125 transition-transform duration-700"
            unoptimized
            priority
          />
        ) : (
          <div className={`w-full h-full bg-linear-to-br ${colorAccent} flex items-center justify-center`}>
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300" />
        
        {/* Gradient accent corner */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${colorAccent} opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-500`} />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
          <div className="flex-1" />
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-white group-hover:to-purple-200 group-hover:bg-clip-text transition-all duration-300">
                {cat.name}
              </h3>
              <p className="text-white/80 text-sm font-medium">
                {cat._count?.products || 0} {cat._count?.products === 1 ? "item" : "items"}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
              <span>Explore Collection</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            All Categories
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore our complete collection of premium products, gifts, and groceries
          </p>
        </div>
      </section>

      {/* Product Categories */}
      {productCategories.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-sm font-semibold text-blue-600">CATEGORY</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Products
              </h2>
              <p className="text-lg text-gray-600">
                Shop from our curated product selection
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {productCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} colorAccent="from-purple-500 to-blue-500" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gift Categories */}
      {giftCategories.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-rose-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 mb-4">
                <div className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-sm font-semibold text-rose-600">CATEGORY</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Premium Gifts
              </h2>
              <p className="text-lg text-gray-600">
                Find the perfect gift for every special occasion
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {giftCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} colorAccent="from-rose-500 to-pink-500" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grocery Categories */}
      {groceryCategories.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-green-50 to-emerald-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span className="text-sm font-semibold text-green-600">CATEGORY</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Fresh Groceries
              </h2>
              <p className="text-lg text-gray-600">
                Essential groceries delivered right to your door
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {groceryCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} colorAccent="from-green-500 to-emerald-500" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {categories.length === 0 && (
        <section className="py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-2xl font-semibold text-gray-900 mb-3">
              No categories yet
            </p>
            <p className="text-gray-600">
              Check back soon for our premium collection of products, gifts, and groceries.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
