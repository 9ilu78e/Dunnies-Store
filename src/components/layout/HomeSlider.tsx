"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { useSiteSettings } from "./SiteSettingsProvider";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const { heroSlides } = useSiteSettings();
  const slides = heroSlides.filter((slide) => slide.image);

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

  const radiusClass = (radius: (typeof slides)[number]["cornerRadius"]) => {
    switch (radius) {
      case "none":
        return "rounded-none";
      case "medium":
        return "rounded-2xl sm:rounded-3xl";
      default:
        return "rounded-md sm:rounded-lg";
    }
  };

  const heightClass = (height: (typeof slides)[number]["heroHeight"]) => {
    switch (height) {
      case "compact":
        return "h-[220px] sm:h-[280px] lg:h-[320px]";
      case "tall":
        return "h-[360px] sm:h-[460px] lg:h-[520px]";
      default:
        return "h-[280px] sm:h-[360px] lg:h-[400px]";
    }
  };

  const hexToRgba = (hex: string, opacity: number) => {
    const value = hex.replace("#", "");
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (slides.length < 2) return;
    if (event.key === "ArrowLeft") {
      setCurrent((index) => (index + slides.length - 1) % slides.length);
    } else if (event.key === "ArrowRight") {
      setCurrent((index) => (index + 1) % slides.length);
    }
  };

  return (
    <section className="bg-white px-2 pt-2 pb-1 sm:px-4 sm:pt-3 sm:pb-2 lg:px-6">
      <div
        className={`relative mx-auto w-full max-w-7xl overflow-hidden bg-linear-to-r from-purple-900 to-pink-900 shadow-lg transition-[height,border-radius] duration-500 ${heightClass(slides[current].heroHeight)} ${radiusClass(slides[current].cornerRadius)}`}
        role="region"
        aria-label="Hero promotions"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {slides.map((slide, index) => (
          <div
            key={`${slide.image}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              index === current
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            aria-hidden={index !== current}
          >
            {slide.image.toLowerCase().split("?")[0].endsWith(".svg") ? (
              <img
                src={slide.image}
                alt={slide.alt || slide.title}
                className="absolute inset-0 h-full w-full"
                style={{ objectFit: slide.imageFit }}
                draggable={false}
              />
            ) : (
              <Image
                src={slide.image}
                alt={slide.alt || slide.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
                style={{ objectFit: slide.imageFit }}
                draggable={false}
                priority={index === 0}
              />
            )}
            {slide.overlayOpacity > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: slide.overlayColor,
                  opacity: slide.overlayOpacity,
                }}
              />
            )}
            <div
              className={`pointer-events-none absolute inset-0 ${
                slide.contentPosition === "center"
                  ? "bg-black/20"
                  : slide.contentPosition === "right"
                    ? "bg-linear-to-l from-black/45 via-black/15 to-transparent"
                    : "bg-linear-to-r from-black/45 via-black/15 to-transparent"
              }`}
              aria-hidden="true"
            />

            <div
              className={`absolute inset-0 z-10 flex items-center ${
                slide.contentPosition === "center"
                  ? "justify-center"
                  : slide.contentPosition === "right"
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <div className="w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <div
                  className={`max-w-2xl ${
                    slide.contentPosition === "center"
                      ? "mx-auto"
                      : slide.contentPosition === "right"
                        ? "ml-auto"
                        : ""
                  }`}
                  style={{ textAlign: slide.textAlignment }}
                >
                  {slide.tag && (
                    <div
                      className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md sm:mb-3 ${
                        slide.textAlignment === "center"
                          ? "mx-auto"
                          : slide.textAlignment === "right"
                            ? "ml-auto"
                            : ""
                      }`}
                      style={{
                        backgroundColor: hexToRgba(
                          slide.tagBackgroundColor,
                          slide.tagBackgroundOpacity
                        ),
                      }}
                    >
                      <Gift className="h-4 w-4" style={{ color: slide.tagTextColor }} />
                      <span
                        className="text-xs font-semibold sm:text-sm"
                        style={{ color: slide.tagTextColor }}
                      >
                        {slide.tag}
                      </span>
                    </div>
                  )}
                  <h1
                    className="mb-1 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl"
                    style={{ color: slide.titleColor }}
                  >
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p
                      className="mb-1 text-base sm:text-lg md:text-xl"
                      style={{ color: slide.subtitleColor }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.description && (
                    <p
                      className={`mb-4 max-w-xl text-sm sm:mb-6 sm:text-base ${
                        slide.textAlignment === "center"
                          ? "mx-auto"
                          : slide.textAlignment === "right"
                            ? "ml-auto"
                            : ""
                      }`}
                      style={{ color: slide.descriptionColor }}
                    >
                      {slide.description}
                    </p>
                  )}
                  <div
                    className={`flex flex-wrap gap-2 sm:gap-3 ${
                      slide.textAlignment === "center"
                        ? "justify-center"
                        : slide.textAlignment === "right"
                          ? "justify-end"
                          : "justify-start"
                    }`}
                  >
                    {slide.ctaText && slide.ctaHref && (
                      <Link
                        href={slide.ctaHref}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-lg transition hover:brightness-95 hover:shadow-xl sm:px-6 sm:py-3 sm:text-sm ${radiusClass(slide.cornerRadius)}`}
                        style={{
                          backgroundColor: slide.primaryButtonBackgroundColor,
                          color: slide.primaryButtonTextColor,
                        }}
                      >
                        {slide.ctaText}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {slide.secondaryCtaText && slide.secondaryCtaHref && (
                      <Link
                        href={slide.secondaryCtaHref}
                        className={`inline-flex items-center border-2 px-4 py-2.5 text-xs font-semibold transition hover:brightness-95 sm:px-6 sm:py-3 sm:text-sm ${radiusClass(slide.cornerRadius)}`}
                        style={{
                          backgroundColor: hexToRgba(
                            slide.secondaryButtonBackgroundColor,
                            slide.secondaryButtonBackgroundOpacity
                          ),
                          color: slide.secondaryButtonTextColor,
                          borderColor: slide.secondaryButtonBorderColor,
                        }}
                      >
                        {slide.secondaryCtaText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              key={`${slide.image}-${index}`}
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
