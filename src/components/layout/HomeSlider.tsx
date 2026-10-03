"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";

const slides = [
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.47.jpeg",
    alt: "Wedding gifts promotion",
  },
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.48.jpeg",
    alt: "Birthday gifts promotion",
  },
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (1).jpeg",
    alt: "Mother's Day gifts promotion",
  },
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (2).jpeg",
    alt: "Ramadan gifts promotion",
  },
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (3).jpeg",
    alt: "Father's Day gifts promotion",
  },
  {
    image: "/assets/WhatsApp Image 2026-10-03 at 04.09.49.jpeg",
    alt: "Eid gifts promotion",
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
        style={{ aspectRatio: "1280 / 853" }}
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
