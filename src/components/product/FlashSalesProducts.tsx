"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, Flame } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductCard from "@/components/product/ProductCard";

type FlashSaleProduct = {
  id: string;
  href: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  imageUrls: string[];
  flashSalePrice: number;
  flashSaleEndsAt: string;
  rating: number;
  reviews: number;
};

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    ...(days > 0 ? [String(days).padStart(2, "0")] : []),
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(remainingSeconds).padStart(2, "0"),
  ].join(":");
}

function SharedSaleCountdown({
  endsAt,
  compact,
  onExpired,
}: {
  endsAt: string;
  compact: boolean;
  onExpired: () => void;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const endTime = new Date(endsAt).getTime();
    const updateCountdown = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= endTime) {
        window.clearInterval(timer);
        onExpired();
      }
    };
    const timer = window.setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => window.clearInterval(timer);
  }, [endsAt, onExpired]);

  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm ${
        compact ? "px-2.5 py-2 sm:px-3" : "px-3 py-2.5 sm:w-fit sm:px-4"
      }`}
    >
      <Clock3 className="h-4 w-4 shrink-0 text-red-500" />
      <span className="text-xs font-semibold sm:text-sm">
        Shared sale ends in
      </span>
      <time
        dateTime={endsAt}
        className="font-mono text-sm font-bold tabular-nums text-red-600 sm:text-base"
      >
        {now === null
          ? "--:--:--"
          : formatTime(new Date(endsAt).getTime() - now)}
      </time>
    </div>
  );
}

type FlashSalesProductsProps = {
  compact?: boolean;
  limit?: number;
};

export default function FlashSalesProducts({
  compact = false,
  limit,
}: FlashSalesProductsProps) {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const response = await fetch("/api/flash-sales", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load flash sales");
        }
        setProducts(data.products || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load flash sales"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchFlashSales();
  }, []);

  const removeExpiredProducts = useCallback(() => {
    const currentTime = Date.now();
    setProducts((current) =>
      current.filter(
        (product) => new Date(product.flashSaleEndsAt).getTime() > currentTime
      )
    );
  }, []);

  if (loading) {
    return <Loader text="Loading active flash sales..." />;
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-2xl bg-red-50 p-6 text-center text-red-700"
      >
        {error}
      </p>
    );
  }

  const activeProducts = products.filter(
    (product) => new Date(product.flashSaleEndsAt).getTime() > Date.now()
  );

  if (activeProducts.length === 0) {
    return (
      <div
        className={`border border-purple-100 bg-white text-center shadow-sm ${
          compact ? "rounded-2xl px-4 py-6" : "rounded-3xl px-6 py-16"
        }`}
      >
        <Flame
          className={`mx-auto text-purple-300 ${
            compact ? "h-8 w-8" : "h-12 w-12"
          }`}
        />
        <h2
          className={`mt-3 font-bold text-gray-900 ${
            compact ? "text-sm" : "text-xl"
          }`}
        >
          No active flash sales right now
        </h2>
        <p className={`mt-1 text-gray-600 ${compact ? "text-xs" : ""}`}>
          Check back soon for limited-time offers.
        </p>
      </div>
    );
  }

  const displayedProducts =
    limit === undefined ? activeProducts : activeProducts.slice(0, limit);
  const sharedEndsAt = activeProducts.reduce<string | null>(
    (earliest, product) =>
      earliest === null ||
      new Date(product.flashSaleEndsAt).getTime() < new Date(earliest).getTime()
        ? product.flashSaleEndsAt
        : earliest,
    null
  );
  return (
    <div>
      {sharedEndsAt && (
        <SharedSaleCountdown
          endsAt={sharedEndsAt}
          compact={compact}
          onExpired={removeExpiredProducts}
        />
      )}
      <div
        className={`-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 sm:gap-6 ${
          compact ? "compact-flash-sales-scroll" : "flash-sales-scroll"
        }`}
        aria-label="Flash sale products. Scroll horizontally to see more."
      >
        {displayedProducts.map((product) => {
          const image = product.imageUrls?.[0] || product.imageUrl;
          const discount = Math.round(
            ((product.price - product.flashSalePrice) / product.price) * 100
          );

          return (
            <div
              key={product.id}
              className={`h-full shrink-0 snap-start ${
                compact
                  ? "w-[58%] sm:w-[30%] lg:w-[23%]"
                  : "w-[72%] sm:w-[46%] lg:w-[31%] xl:w-[23%]"
              }`}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.flashSalePrice}
                originalPrice={product.price}
                rating={product.rating}
                reviews={product.reviews}
                image={image || undefined}
                discount={discount}
                stockQuantity={product.stockQuantity}
                href={product.href}
                className={
                  compact ? "rounded-xl" : "rounded-2xl sm:rounded-3xl"
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
