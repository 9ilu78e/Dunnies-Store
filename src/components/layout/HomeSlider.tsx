"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";

const slides = [
  {
    image: "/assets/hero-gifts.png",
    alt: "Gift collection",
    width: 1672,
    height: 941,
  },
  {
    image: "/assets/hero-souvenirs.png",
    alt: "Souvenirs and keepsakes",
    width: 1536,
    height: 1024,
  },
  {
    image: "/assets/hero-products.png",
    alt: "Premium products",
    width: 1672,
    height: 941,
  },
  {
    image: "/assets/hero-bestsellers.png",
    alt: "Bestselling products",
    width: 1536,
    height: 1024,
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      setCurrent((index) => (index + slides.length - 1) % slides.length);
    } else if (event.key === "ArrowRight") {
      setCurrent((index) => (index + 1) % slides.length);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-8">
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-purple-100 sm:rounded-3xl"
        style={{ aspectRatio: `${slides[current].width} / ${slides[current].height}` }}
        role="region"
        aria-label="Hero promotions"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              index === current ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={index !== current}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="(max-width: 1280px) 100vw, 1152px"
              className="object-contain"
              draggable={false}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div
        className="flex justify-center gap-2 pt-3"
        aria-label="Slide navigation"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setCurrent(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === current ? "w-7 bg-purple-700" : "w-2.5 bg-purple-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
