import type { Metadata } from "next";
import ProductList from "@/components/product/ProductList";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function fetchBestSellers() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    });

    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      rating: 4.5,
      reviews: 0,
      image: product.imageUrl || "",
      tag: product.category?.name || "Product",
      href: `/product/${product.id}`,
    }));
  } catch (error) {
    console.error("Failed to fetch best sellers:", error);
    return [];
  }
}

const promiseCards = [
  {
    title: "Realtime rankings",
    description:
      "Pulled from live orders, wishlists, and re-deliveries across the globe.",
  },
  {
    title: "Purple-glove QC",
    description:
      "Every product is inspected by concierge teams before shipping out.",
  },
  {
    title: "Doorstep ready",
    description:
      "Worldwide delivery partners ensure gifts arrive exactly how you imagined.",
  },
];

export const metadata: Metadata = {
  title: "Best Sellers – Dunnis Stores",
  description:
    "Shop the most-loved products on Dunnis Stores. Updated daily with verified reviews and repeat purchases.",
};

export default async function BestSellersPage() {
  const bestSellers = await fetchBestSellers();

  return (
    <section className="bg-linear-to-b from-purple-50 via-white to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="rounded-4xl bg-linear-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.4em] uppercase text-purple-200">
              Best sellers
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Shop the products everyone is talking about
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-3xl">
              These cult-favorite gifts, souvenirs, and daily luxuries are
              moving fastest in every city we deliver to. Updated hourly with
              live reviews, verified reorders, and concierge quality scores.
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
              <Link
                href="/signature-experiences"
                className="inline-flex items-center gap-2 rounded-full bg-white/90 text-purple-700 px-6 py-3 text-sm font-semibold hover:bg-white"
              >
                Concierge-curated sets
              </Link>
            </div>
            <div className="text-sm text-purple-100">
              Updated <strong className="font-semibold">daily</strong> from live
              orders and wishlist data.
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
                Finest picks loved globally
              </h2>
            </div>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-5 py-2 text-sm font-semibold hover:bg-purple-500 transition"
            >
              See all products
            </Link>
          </div>

          <ProductList products={bestSellers} cols={4} gap={8} />
        </div>
      </div>
    </section>
  );
}
