"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Flame } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  type: "product" | "gift" | "souvenir";
}

export default function SpotlightCollections() {
  const router = useRouter();
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Category request failed with status ${response.status}`);
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (categoryError) {
        console.error("Failed to fetch categories:", categoryError);
        setCategoriesError("Categories are temporarily unavailable.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
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
                Signature experiences
              </div>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg font-bold">Signature picks</h3>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="mt-3 space-y-5">
                  <p className="text-purple-100">
                    For when you need the gift to feel personal, immersive, and
                    far from basic. Each pick pairs premium packaging with a
                    story to tell.
                  </p>

                  <label className="relative block">
                    <span className="mb-2 block text-sm font-semibold text-purple-100">
                      Choose a category
                    </span>
                    <select
                      defaultValue=""
                      disabled={categoriesLoading || categories.length === 0}
                      onChange={(event) => {
                        if (event.target.value) {
                          router.push(
                            `/product?category=${encodeURIComponent(event.target.value)}`
                          );
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-white/30 bg-purple-800 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 disabled:opacity-60"
                    >
                      <option value="" disabled className="bg-white text-gray-900">
                        {categoriesLoading ? "Loading categories..." : "Select a category"}
                      </option>
                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          className="bg-white text-gray-900"
                        >
                          {category.name} ({category.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-white" />
                  </label>
                  {categoriesError && (
                    <p className="text-sm text-purple-100" role="status">
                      {categoriesError}
                    </p>
                  )}

                  <Link
                    href="/signature-experiences"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-gray-900 font-semibold py-3 hover:bg-purple-50 transition"
                  >
                    Explore signature picks
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
