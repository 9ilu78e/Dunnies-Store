"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Gift, ArrowRight } from "lucide-react";
import Loader from "@/components/ui/Loader";

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  _count?: {
    products: number;
  };
}

export default function GiftCategoriesGrid() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/categories?type=gift&t=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch gift categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    const interval = setInterval(fetchCategories, 15000); // Fetch every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll);
      return () => scrollElement.removeEventListener("scroll", checkScroll);
    }
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-linear-to-br from-pink-50 via-white to-rose-50 py-12">
        <Loader text="Loading gift categories..." />
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-linear-to-br from-pink-50 via-white to-rose-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-pink-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Gift Categories
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Find the perfect gifts for every occasion
            </p>
          </div>

          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-2.5 rounded-full bg-white hover:bg-pink-50 border-2 border-gray-200 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-2.5 rounded-full bg-white hover:bg-pink-50 border-2 border-gray-200 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="flex-none w-44 sm:w-48 snap-start group/card"
              >
                <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-pink-300 hover:-translate-y-1">
                  <div className="w-full h-44 sm:h-48 relative overflow-hidden bg-gray-200">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 44vw, 12rem"
                        className="object-cover group-hover/card:scale-110 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-pink-100 to-rose-100">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />

                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                          {cat.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-pink-600 text-xs font-semibold">
                            {cat._count?.products || 0} items
                          </p>
                          <ArrowRight className="w-3.5 h-3.5 text-pink-600 group-hover/card:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-pink-50 via-pink-50/80 to-transparent pointer-events-none z-10" />
          )}
          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-pink-50 via-pink-50/80 to-transparent pointer-events-none z-10" />
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
