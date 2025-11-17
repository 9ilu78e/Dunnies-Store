"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";

interface ProductProps {
  name: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  tag?: string;
  discount?: number;
  href?: string;
}

export default function ProductCard({
  name = "Unnamed Product",
  description = "Discover this amazing product with premium quality and great features.",
  price = 0,
  originalPrice,
  rating = 0,
  reviews = 0,
  image = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&auto=format",
  tag = "New",
  discount = 0,
  href = "#",
}: ProductProps) {
  const formattedPrice = price ? `₦${Number(price).toLocaleString()}` : "₦0";
  const formattedOriginal = originalPrice
    ? `₦${Number(originalPrice).toLocaleString()}`
    : null;

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!href || href === "#") {
      return <div className="cursor-default">{children}</div>;
    }
    return <Link href={href}>{children}</Link>;
  };

  return (
    <CardWrapper>
      <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-violet-300 relative max-w-sm mx-auto">
        <div className="relative overflow-hidden bg-gray-50 h-56 sm:h-64 aspect-square">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-md">
              -{discount}% OFF
            </div>
          )}

          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-violet-600 px-3 py-1 text-xs font-bold rounded-full shadow-md border border-violet-100">
            {tag}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <button
              onClick={(e) => e.preventDefault()}
              className="bg-white text-gray-700 p-2.5 rounded-full hover:bg-violet-600 hover:text-white transition-all duration-200 shadow-xl hover:scale-110"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => e.preventDefault()}
              className="bg-white text-gray-700 p-2.5 rounded-full hover:bg-violet-600 hover:text-white transition-all duration-200 shadow-xl hover:scale-110"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300 fill-gray-300"
                }`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1 font-medium">
              ({reviews})
            </span>
          </div>

          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight">
            {name}
          </h3>

          <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {formattedPrice}
            </span>
            {formattedOriginal && (
              <span className="text-sm text-gray-400 line-through font-medium">
                {formattedOriginal}
              </span>
            )}
          </div>

          <button
            onClick={(e) => e.preventDefault()}
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <ShoppingCart className="w-4 h-4 group-hover/btn:animate-bounce" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </CardWrapper>
  );
}
