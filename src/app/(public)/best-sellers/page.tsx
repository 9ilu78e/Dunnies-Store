import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { getBestSellers } from "@/lib/bestSellers";

export const dynamic = "force-dynamic";

const promiseCards = [
  {
    title: "Ranked by orders",
    description: "Items appear in order of distinct, non-cancelled orders.",
  },
  {
    title: "Products, gifts, and souvenirs",
    description: "All three store collections share one bestseller ranking.",
  },
  {
    title: "New items included",
    description: "Items without orders remain visible and sort after sold items.",
  },
];

export const metadata: Metadata = {
  title: "Best Sellers – Dunnis Stores",
  description:
    "Shop the most-ordered products, gifts, and souvenirs at Dunnis Stores.",
};

export default async function BestSellersPage() {
  const bestSellers = await getBestSellers(18);

  return (
    <section className="bg-linear-to-b from-purple-50 via-white to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="rounded-4xl bg-linear-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.4em] uppercase text-purple-200">
              Best sellers
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Shop the items customers order most
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-3xl">
              Products, gifts, and souvenirs are ranked by the number of
              non-cancelled orders they appear in. Newer items break ties and
              stay visible while they build a sales history.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/worldwide-favorites"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Explore global picks
              </Link>
            </div>
            <div className="text-sm text-purple-100">
              Rankings use order history and exclude cancelled or refunded
              orders.
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promiseCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 mb-2">
                {card.title}
              </p>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-4xl border border-purple-100 bg-white/80 backdrop-blur px-4 py-8 sm:px-6 lg:px-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
                Bestseller grid
              </p>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                Most ordered across the store
              </h2>
            </div>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-5 py-2 text-sm font-semibold hover:bg-purple-500 transition"
            >
              See all products
            </Link>
          </div>

          {bestSellers.length > 0 ? (
            <div
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-5"
              aria-label="Best-selling products. Scroll horizontally to see more."
            >
              {bestSellers.map((product, index) => (
                <div
                  key={product.id}
                  className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23%]"
                >
                  <ProductCard
                    {...product}
                    priority={index < 2}
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-600">
              No products available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
