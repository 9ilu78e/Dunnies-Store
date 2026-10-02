"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductList from "@/components/product/ProductList";

interface BestSeller {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  tag: string;
  href: string;
  orderCount: number;
}

export default function SpotlightCollections() {
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch("/api/best-sellers?limit=4", {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.error || "Best sellers are temporarily unavailable."
          );
        }

        const data = await response.json();
        setBestSellers(data.products || []);
      } catch (error) {
        console.error("Failed to fetch best sellers:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Best sellers are temporarily unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  const signatureHighlights = bestSellers.slice(0, 3).map((product) => ({
    id: product.id,
    name: product.name,
    href: product.href,
  }));

  return (
    <section className="py-16 bg-linear-to-b from-purple-50 via-white to-purple-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col gap-4 text-center">
          <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-purple-500">
            <Flame className="w-4 h-4 text-amber-500" />
            Spotlight
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            What&apos;s hot right now
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Products, gifts, and souvenirs ranked by distinct orders, with new
            items included until their sales history grows.
          </p>
        </div>

        {loading ? (
          <div className="p-12">
            <Loader text="Loading spotlight collections..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8 lg:gap-12">
            <div className="rounded-3xl bg-white/95 backdrop-blur border border-purple-100 shadow-lg p-6 sm:p-8 space-y-6">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 rounded-full px-4 py-1 self-start">
                  <Flame className="w-4 h-4" />
                  Best sellers
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Loved by thousands
                </h3>
                <p className="text-gray-600">
                  These products ship out the fastest—perfect for when you need
                  a guaranteed hit.
                </p>
              </div>
              {error ? (
                <p className="text-red-600" role="alert">
                  {error}
                </p>
              ) : bestSellers.length > 0 ? (
                <>
                  <ProductList products={bestSellers} cols={4} gap={6} />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-500">
                      Ranked by non-cancelled orders; newest items break ties.
                    </p>
                    <Link
                      href="/best-sellers"
                      className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700"
                    >
                      Shop all best sellers
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">No catalog items available yet.</p>
              )}
            </div>

            <div className="rounded-3xl bg-linear-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-200 bg-white/10 rounded-full px-4 py-1 self-start">
                <Sparkles className="w-4 h-4 text-purple-200" />
                Signature experiences
              </div>
              <div>
                <h3 className="text-lg font-bold">Concierge curated</h3>
                <p className="text-purple-100 mt-2">
                  For when you need the gift to feel personal, immersive, and
                  far from basic. Each pick pairs premium packaging with a story
                  to tell.
                </p>
              </div>

              {!error && signatureHighlights.length > 0 ? (
                <>
                  <ul className="space-y-4">
                    {signatureHighlights.map((product) => (
                      <li
                        key={product.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4"
                      >
                        <p className="text-base font-semibold">
                          {product.name}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signature-experiences"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-gray-900 font-semibold py-3 hover:bg-purple-50 transition"
                  >
                    Explore concierge picks
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <p className="text-purple-100">No catalog items available yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
