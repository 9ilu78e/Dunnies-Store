"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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

type CategoryType = "product" | "gift" | "souvenir";

const categoryContent: Record<
  CategoryType,
  { title: string; description: string; loaderText: string }
> = {
  product: {
    title: "Popular Product Categories",
    description: "Browse our product collections",
    loaderText: "Loading product categories...",
  },
  gift: {
    title: "Gift Categories",
    description: "Find the right gift for every occasion",
    loaderText: "Loading gift categories...",
  },
  souvenir: {
    title: "Souvenir Categories",
    description: "Explore keepsakes and locally inspired treasures",
    loaderText: "Loading souvenir categories...",
  },
};

export default function CategoriesGrid({ type }: { type: CategoryType }) {
  const content = categoryContent[type];
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
          `/api/categories?type=${type}&t=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Unable to fetch ${type} categories`);
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    const interval = setInterval(fetchCategories, 15000);

    return () => clearInterval(interval);
  }, [type]);

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
  }, [categories]);

  if (loading) {
    return (
      <section className="w-full bg-linear-to-br from-violet-50 via-white to-fuchsia-50 py-12">
        <Loader text={content.loaderText} />
      </section>
    );
  }

  return (
    <section className="w-full bg-linear-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 lg:py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {content.title}
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm">
              {content.description}
            </p>
          </div>

          <div className="hidden md:flex gap-1.5">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-2 rounded-full bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-2 rounded-full bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <div
            ref={scrollRef}
            className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/product?category=${cat.id}`}
                  className="flex-none w-32 sm:w-36 snap-start group/card"
                >
                  <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg">
                    <div className="relative h-32 w-full overflow-hidden bg-gray-200 sm:h-36">
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
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />

                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <div className="rounded-md bg-white/95 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                          <span className="block truncate text-xs font-bold leading-4 text-gray-900">
                            {cat.name}
                          </span>
                          <div className="flex items-center justify-between leading-3">
                            <span className="text-[6px] font-medium text-violet-600">
                              {cat._count?.products || 0} items
                            </span>
                            <ArrowRight className="h-2.5 w-2.5 text-violet-600 transition-transform group-hover/card:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                No categories available
              </div>
            )}
          </div>

          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-violet-50 via-violet-50/80 to-transparent pointer-events-none z-10" />
          )}
          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-violet-50 via-violet-50/80 to-transparent pointer-events-none z-10" />
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
