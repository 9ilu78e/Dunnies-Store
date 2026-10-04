"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductCard from "@/components/product/ProductCard";

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
        const response = await fetch("/api/best-sellers?limit=12", {
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
          <div className="grid grid-cols-1 gap-8">
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
                  <div
                    className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 scrollbar-hide sm:gap-5"
                    aria-label="Best-selling products. Scroll horizontally to see more."
                  >
                    {bestSellers.map((product, index) => (
                      <div
                        key={product.id}
                        className="h-full w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
                      >
                        <ProductCard
                          {...product}
                          priority={index < 2}
                          className="rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
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

          </div>
        )}
      </div>
    </section>
  );
}
