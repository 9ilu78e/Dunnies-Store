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
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8 px-2 sm:px-4">
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
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 self-start text-sm font-semibold text-amber-600">
                <Flame className="h-4 w-4" />
                Best sellers
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Loved by thousands
              </h3>
              <p className="text-gray-600">
                These products ship out the fastest—perfect for when you need a
                guaranteed hit.
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
                      className="h-full w-[58%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"
                    >
                      <ProductCard {...product} priority={index < 2} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Ranked by non-cancelled orders; newest items break ties.
                  </p>
                  <Link
                    href="/best-sellers"
                    className="inline-flex items-center gap-2 font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Shop all best sellers
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-gray-600">No catalog items available yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
