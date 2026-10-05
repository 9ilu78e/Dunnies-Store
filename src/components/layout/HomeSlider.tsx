"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import { useSiteSettings } from "./SiteSettingsProvider";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const { heroImages } = useSiteSettings();
  const slides = heroImages.map((image) => ({
    image,
    alt: "Dunni Stores promotion",
  }));

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (slides.length < 2) return;
    if (event.key === "ArrowLeft") {
      setCurrent((index) => (index + slides.length - 1) % slides.length);
    } else if (event.key === "ArrowRight") {
      setCurrent((index) => (index + 1) % slides.length);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-8">
      <div
        className="relative mx-auto aspect-[1280/853] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-purple-100 sm:rounded-3xl lg:aspect-[3.5/1]"
        role="region"
        aria-label="Hero promotions"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              index === current
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            aria-hidden={index !== current}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="(max-width: 1280px) 100vw, 1152px"
              className="object-contain lg:object-cover"
              draggable={false}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      {slides.length > 1 && (
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
      )}
    </section>
  );
}
