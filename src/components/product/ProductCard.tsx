"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, StarHalf } from "lucide-react";
import Image from "next/image";

interface ProductProps {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  tag?: string;
  discount?: number;
  stockQuantity?: number;
  orderCount?: number;
  href?: string;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  originalPrice,
  rating = 0,
  reviews = 0,
  image,
  orderCount,
  discount = 0,
  stockQuantity,
  href = "#",
  className = "",
  priority = false,
}: ProductProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isUnavailablePlaceholder = image?.includes("via.placeholder.com");
  const displayImage =
    image && !imageFailed && !isUnavailablePlaceholder ? image : "";
  const normalizedRating = Math.round(Math.max(0, Math.min(5, rating)) * 2) / 2;
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars === 0.5;
  const formattedPrice = `₦${Number(price).toLocaleString()}`;
  const formattedOriginal = originalPrice
    ? `₦${Number(originalPrice).toLocaleString()}`
    : null;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : discount;

  const computedHref =
    href && href !== "#"
      ? href
      : typeof id === "string"
      ? `/product/${id}`
      : "#";

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!computedHref || computedHref === "#")
      return <div className="h-full cursor-default">{children}</div>;
    return (
      <Link href={computedHref} className="block h-full">
        {children}
      </Link>
    );
  };

  return (
    <CardWrapper>
      <div
        className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-300 relative flex flex-col h-full min-w-0 w-full ${className}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              width={400}
              height={300}
              priority={priority}
              sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 23vw"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm font-medium">
                No Image
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {typeof orderCount === "number" && (
            <span className="absolute left-2 top-2 rounded-full bg-purple-700/95 px-2 py-1 text-[10px] font-semibold text-white">
              {orderCount} {orderCount === 1 ? "order" : "orders"}
            </span>
          )}
          <span
            className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10px] font-semibold ${
              typeof stockQuantity !== "number"
                ? "bg-gray-100 text-gray-600"
                : stockQuantity > 0
                ? "bg-white/95 text-gray-700"
                : "bg-red-600 text-white"
            }`}
          >
            {typeof stockQuantity !== "number"
              ? "Stock unavailable"
              : stockQuantity > 0
              ? `${stockQuantity} in stock`
              : "Out of stock"}
          </span>
        </div>

        <div className="flex min-h-7 items-center gap-1.5 bg-amber-50 px-2 py-1">
          <div
            className="flex items-center gap-px"
            aria-label={`${rating.toFixed(1)} out of 5 stars`}
          >
            {[...Array(5)].map((_, i) => {
              const className =
                i < fullStars
                  ? "h-3 w-3 fill-amber-500 text-amber-500"
                  : i === fullStars && hasHalfStar
                  ? "h-3 w-3 fill-amber-500 text-amber-500"
                  : "h-3 w-3 fill-gray-300 text-gray-300";

              return i === fullStars && hasHalfStar ? (
                <StarHalf key={`star-${id}-${i}`} className={className} />
              ) : (
                <Star key={`star-${id}-${i}`} className={className} />
              );
            })}
          </div>
          <span className="text-[10px] font-semibold text-amber-700">
            {rating.toFixed(1)} ({reviews})
          </span>
        </div>

        <div className="p-2">
          <span className="block line-clamp-2 text-[15px] leading-5 text-gray-700 transition-colors group-hover:text-purple-600">
            {name}
          </span>

          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-base font-bold text-black">
              {formattedPrice}
            </span>
            {formattedOriginal && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formattedOriginal}
                </span>
                {discountPercent > 0 && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    -{discountPercent}%
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
