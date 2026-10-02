import type { Metadata } from "next";
import Link from "next/link";
import SignatureProductSelector from "@/components/layout/SignatureProductSelector";
import { prisma } from "@/lib/prisma";

async function fetchSignatureExperiences() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        comments: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 9,
    });

    return products.map((product: any) => {
      const isFlashSaleActive =
        product.flashSalePrice !== null &&
        product.flashSaleEndsAt !== null &&
        product.flashSaleEndsAt.getTime() > Date.now();
      return {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: isFlashSaleActive
          ? product.flashSalePrice ?? product.price
          : product.price,
        originalPrice: isFlashSaleActive ? product.price : undefined,
        categoryId: product.categoryId || "",
        categoryName: product.category?.name || "Experience",
        rating:
          product.comments.length > 0
            ? Math.round(
                (product.comments.reduce(
                  (sum: number, comment: { rating: number }) =>
                    sum + comment.rating,
                  0
                ) /
                  product.comments.length) *
                  10
              ) / 10
            : 0,
        reviews: product.comments.length,
        stockQuantity: product.stockQuantity,
        image: product.imageUrl || "",
        tag: product.category?.name || "Experience",
        href: `/product/${product.id}`,
      };
    });
  } catch (error) {
    console.error("Failed to fetch signature experiences:", error);
    return [];
  }
}

const conciergePromises = [
  "White-glove packaging with handwritten notes on request",
  "Next-day delivery within Lagos and express nationwide shipping",
  "Dedicated concierge chat for swaps, customizations, or bulk gifting",
];

export const metadata: Metadata = {
  title: "Signature Experiences – Dunnis Stores",
  description:
    "Let our concierge team do the thinking. Discover curated drops that feel personal, premium, and totally effortless.",
};

export default async function SignatureExperiencesPage() {
  const signatureExperiences = await fetchSignatureExperiences();

  return (
    <section className="bg-linear-to-b from-purple-900 via-purple-800 to-purple-700 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur shadow-2xl">
          <p className="text-xs font-semibold tracking-[0.4em] text-purple-200 uppercase">
            Concierge
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">
            Signature experiences
          </h1>
          <p className="text-base sm:text-lg text-purple-100 mt-3">
            When a standard gift won&apos;t cut it, lean on our shopper-curated
            combos. These are bundles that photograph beautifully, arrive with
            elevated packaging, and feel bespoke without the sourcing hassle.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {conciergePromises.map((promise) => (
              <div
                key={promise}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-purple-100"
              >
                {promise}
              </div>
            ))}
          </div>
        </header>

        <div className="rounded-3xl bg-white text-gray-900 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-xs font-semibold tracking-[0.4em] text-purple-600 uppercase">
              Curated drop
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              High-touch gifts without the stress
            </h2>
            <p className="text-gray-600">
              We cycle this list weekly based on VIP client requests, seasonal
              events, and feedback from our packaging studio.
            </p>
          </div>

          <SignatureProductSelector products={signatureExperiences} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-500">
              Need corporate or wedding gifting support?
              <span className="font-semibold text-gray-800 ml-1">
                Concierge@dunnis.store
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 text-purple-700 px-6 py-2 text-sm font-semibold hover:bg-purple-50 transition"
              >
                Talk to concierge
              </Link>
              <Link
                href="/best-sellers"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition"
              >
                Shop customer favorites
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
