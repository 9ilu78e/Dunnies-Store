"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gift, ArrowRight } from "lucide-react";

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  href: string;
  tag: string;
}

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlideData = async () => {
      try {
        setLoading(true);

        const slideData: Slide[] = [
          {
            title: "Special Holiday Gifts",
            subtitle: "Make every moment memorable",
            description: "Discover unique gifts for your loved ones",
            image: "/assets/slide1.jpg",
            cta: "Shop Gifts",
            href: "/gift",
            tag: "New Arrivals",
          },
          {
            title: "Souvenirs & Keepsakes",
            subtitle: "Make every memory last",
            description:
              "Discover meaningful mementos and locally inspired finds",
            image: "/assets/slide2.jpg",
            cta: "Shop Souvenirs",
            href: "/souvenirs",
            tag: "Made to Remember",
          },
          {
            title: "Premium Products",
            subtitle: "Quality you can trust",
            description: "Explore our collection of premium items",
            image: "/assets/slide3.jpg",
            cta: "Shop Products",
            href: "/product",
            tag: "Gift Picks",
          },
        ];

        setSlides(slideData);
      } catch (error) {
        console.error("Error fetching slide data:", error);
        setSlides([
          {
            title: "Special Holiday Gifts",
            subtitle: "Make every moment memorable",
            description: "Discover unique gifts for your loved ones",
            image: "/assets/slide1.jpg",
            cta: "Shop Gifts",
            href: "/gift",
            tag: "New Arrivals",
          },
          {
            title: "Souvenirs & Keepsakes",
            subtitle: "Make every memory last",
            description:
              "Discover meaningful mementos and locally inspired finds",
            image: "/assets/slide2.jpg",
            cta: "Shop Souvenirs",
            href: "/souvenirs",
            tag: "Made to Remember",
          },
          {
            title: "Premium Products",
            subtitle: "Quality you can trust",
            description: "Explore our collection of premium items",
            image: "/assets/slide3.jpg",
            cta: "Shop Products",
            href: "/product",
            tag: "Exclusive",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlideData();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="bg-white px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2 lg:px-8">
      <div className="relative h-[260px] overflow-hidden rounded-2xl bg-linear-to-r from-purple-900 to-pink-900 sm:h-[330px] sm:rounded-3xl lg:h-[400px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />

            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full mb-2">
                    <Gift className="w-4 h-4 text-yellow-300" />
                    <span className="text-white text-xs font-semibold">
                      {slide.tag}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-purple-100 mb-0.5">
                    {slide.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-200 mb-3">
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Link
                      href={slide.href}
                      className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 text-xs sm:text-sm"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/product"
                      className="bg-transparent border-2 border-white text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all text-xs sm:text-sm"
                    >
                      Shop All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>
      <div className="flex justify-center gap-2 pt-3" aria-label="Slide navigation">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-purple-700" : "w-2 bg-purple-300"
            }`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
