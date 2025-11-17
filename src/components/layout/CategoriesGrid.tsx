"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Birthday Gifts",
    href: "/gifts/birthday",
    items: 428,
    image:
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
  },
  {
    name: "Wedding Gifts",
    href: "/gifts/wedding",
    items: 312,
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&h=300&fit=crop&auto=format",
  },
  {
    name: "Baby & Newborn",
    href: "/gifts/baby",
    items: 398,
    image:
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=300&h=300&fit=crop&auto=format",
  },
  {
    name: "Luxury Gifts",
    href: "/gifts/luxury",
    items: 92,
    image:
      "https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80",
  },
];

export default function GiftCategoryScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 45,
    seconds: 23,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
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

  return (
    <section className="w-full bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-white animate-pulse" />
              <span className="text-white font-semibold text-sm sm:text-base">
                Limited Time Offer
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] text-center border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-white/90 uppercase font-medium">
                  Hours
                </div>
              </div>

              <span className="text-white text-xl sm:text-2xl font-bold">
                :
              </span>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] text-center border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-white/90 uppercase font-medium">
                  Mins
                </div>
              </div>

              <span className="text-white text-xl sm:text-2xl font-bold">
                :
              </span>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] text-center border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] sm:text-xs text-white/90 uppercase font-medium">
                  Secs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Popular Categories
            </h2>
            <p className="text-gray-600 text-sm">
              Discover gifts for every special moment
            </p>
          </div>

          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-2.5 rounded-full bg-white hover:bg-violet-50 border-2 border-gray-200 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-2.5 rounded-full bg-white hover:bg-violet-50 border-2 border-gray-200 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
                key={cat.name}
                href={cat.href}
                className="flex-none w-44 sm:w-48 snap-start group/card"
              >
                <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-violet-300 hover:-translate-y-1">
                  <div className="w-full h-44 sm:h-48 relative overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 44vw, 12rem"
                      className="object-cover group-hover/card:scale-110 transition-transform duration-700"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />

                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                          {cat.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-violet-600 text-xs font-semibold">
                            {cat.items} items
                          </p>
                          <ArrowRight className="w-3.5 h-3.5 text-violet-600 group-hover/card:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-violet-50 via-violet-50/80 to-transparent pointer-events-none z-10" />
          )}
          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-violet-50 via-violet-50/80 to-transparent pointer-events-none z-10" />
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
