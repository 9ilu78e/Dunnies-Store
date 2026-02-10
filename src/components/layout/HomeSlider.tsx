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
            title: "Fresh Groceries & Essentials",
            subtitle: "Quality items delivered fast",
            description: "Shop fresh produce and pantry essentials",
            image: "/assets/slide2.jpg",
            cta: "Shop Groceries",
            href: "/groceries",
            tag: "Gift Deals",
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
            title: "Fresh Groceries & Essentials",
            subtitle: "Quality items delivered fast",
            description: "Shop fresh produce and pantry essentials",
            image: "/assets/slide2.jpg",
            cta: "Shop Groceries",
            href: "/groceries",
            tag: "Fresh & Quality",
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
    <section className="relative h-[500px] sm:h-[600px] overflow-hidden bg-linear-to-r from-purple-900 to-pink-900">
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4">
                  <Gift className="w-5 h-5 text-yellow-300" />
                  <span className="text-white text-sm font-semibold">
                    {slide.tag}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-100 mb-2">
                  {slide.subtitle}
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-8">
                  {slide.description}
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href={slide.href}
                    className="bg-white text-purple-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                  <Link
                    href="/product"
                    className="bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all text-sm sm:text-base"
                  >
                    Shop All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
