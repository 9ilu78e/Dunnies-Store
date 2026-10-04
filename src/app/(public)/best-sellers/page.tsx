import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import { getBestSellers } from "@/lib/bestSellers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Sellers – Dunnis Stores",
  description:
    "Shop the most-ordered products, gifts, and souvenirs at Dunnis Stores.",
};

export default async function BestSellersPage() {
  const bestSellers = await getBestSellers(18);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
          Best Sellers
        </h1>

        {bestSellers.length > 0 ? (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4"
            aria-label="Best-selling products"
          >
            {bestSellers.map((product, index) => (
              <div key={product.id} className="min-w-0">
                <ProductCard {...product} priority={index < 2} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-600">
            No products available yet.
          </p>
        )}
      </div>
    </section>
  );
}
