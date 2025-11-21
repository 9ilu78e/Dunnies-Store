import type { Metadata } from "next";
import Link from "next/link";
import ProductList from "@/components/product/ProductList";
import { productsCatalog } from "@/Data/products";

const worldFavorites = [...productsCatalog]
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 15)
  .map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    rating: product.rating,
    reviews: product.reviewsCount,
    image: product.image,
    tag: product.tag,
    href: product.href,
  }));

const journeyCards = [
  {
    title: "Same-day Lagos & Abuja",
    detail: "Concierge riders are on standby for ultra-fast gifting.",
  },
  {
    title: "72hr World Delivery",
    detail: "Priority shipping lanes for London, Toronto, Dubai, Nairobi.",
  },
  {
    title: "Climate-smart packaging",
    detail: "Cushioned, recyclable, and wow-worthy on arrival.",
  },
];

const curatedCollections = [
  {
    label: "City soirées",
    description:
      "Statement pieces and table accents curated for rooftop moments.",
    href: "/signature-experiences",
  },
  {
    label: "Wellness rituals",
    description: "Clean pantry heroes and mindful self-care from indie makers.",
    href: "/product",
  },
  {
    label: "Corporate gratitude",
    description:
      "Elevated presents for clients, teams, and cross-border partners.",
    href: "/contact",
  },
];

export const metadata: Metadata = {
  title: "Worldwide Favorites – Dunnis Stores",
  description:
    "Trend-forward picks trusted by customers in 45+ cities. Built for global gifting, everyday luxury, and fast delivery.",
};

export default function WorldwideFavoritesPage() {
  return (
    <section className="bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="rounded-[48px] border border-white/20 bg-white/5 backdrop-blur p-8 sm:p-12 shadow-2xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-purple-200">
            Global spotlight
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Worldwide favorites built for every timezone
          </h1>
          <p className="text-base sm:text-lg text-purple-100 max-w-3xl">
            From Lagos rooftops to London dinner parties, these purple-stamped
            picks keep customers reordering. Track what’s trending, get
            inspired, and deliver joy anywhere.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/best-sellers"
              className="inline-flex items-center gap-2 rounded-full bg-white text-purple-700 px-6 py-3 font-semibold hover:bg-purple-50"
            >
              Back to best sellers
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10"
            >
              Speak with concierge
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {journeyCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur"
            >
              <p className="text-xs state font-semibold uppercase tracking-[0.3em] text-purple-200">
                {card.title}
              </p>
              <p className="text-sm text-purple-100 mt-3">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[36px] bg-white text-purple-900 p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-500">
                World grid
              </p>
              <h2 className="text-2xl font-bold text-purple-900">
                Trending now in every city
              </h2>
              <p className="text-sm text-purple-700 mt-1">
                Always two columns on mobile for the smoothest browsing
                anywhere.
              </p>
            </div>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-5 py-2 font-semibold hover:bg-purple-500"
            >
              View catalog
            </Link>
          </div>

          <ProductList products={worldFavorites} cols={4} gap={8} />
        </div>

        <div className="rounded-[32px] border border-white/20 bg-white/10 backdrop-blur p-8 space-y-6">
          <h3 className="text-2xl font-semibold">
            Need a direction? Start here.
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {curatedCollections.map((collection) => (
              <Link
                key={collection.label}
                href={collection.href}
                className="rounded-3xl bg-white/15 border border-white/20 p-6 hover:bg-white/25 transition"
              >
                <p className="text-sm uppercase tracking-[0.4em] text-purple-200 mb-3">
                  {collection.label}
                </p>
                <p className="text-base text-purple-100">
                  {collection.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Explore
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
