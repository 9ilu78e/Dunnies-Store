"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const slides = [
  { image: "/assets/hero-gifts.png", alt: "Gift collection" },
  { image: "/assets/hero-souvenirs.png", alt: "Souvenirs and keepsakes" },
  { image: "/assets/hero-products.png", alt: "Premium products" },
  { image: "/assets/hero-bestsellers.png", alt: "Bestselling products" },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-3 pt-3 sm:px-6 sm:pt-6 lg:px-8">
      <div className="relative h-[260px] overflow-hidden rounded-2xl sm:h-[330px] sm:rounded-3xl lg:h-[400px]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
