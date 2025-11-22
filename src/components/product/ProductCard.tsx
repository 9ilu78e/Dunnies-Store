"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Star, Eye, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";

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
  href?: string;
  className?: string;
}

export default function ProductCard({
  id,
  name = "Unnamed Product",
  description = "Discover this amazing product with premium quality and great features.",
  price = 0,
  originalPrice,
  rating = 4.5,
  reviews = 128,
  image = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&auto=format",
  tag = "New",
  discount = 0,
  href = "#",
  className = "",
}: ProductProps) {
  // Use fallback image if image is empty or undefined
  const displayImage = image && image.trim() !== "" ? image : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&auto=format";
  const [isNavigating, setIsNavigating] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const formattedPrice = `₦${Number(price).toLocaleString()}`;
  const formattedOriginal = originalPrice
    ? `₦${Number(originalPrice).toLocaleString()}`
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ id, name, price, image, href: computedHref });
  };

  const wishlisted = isInWishlist(id);

  const computedHref =
    href && href !== "#"
      ? href
      : typeof id === "string"
      ? `/product/${id}`
      : "#";

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!computedHref || computedHref === "#")
      return <div className="cursor-default">{children}</div>;
    return (
      <Link href={computedHref} onClick={() => setIsNavigating(true)}>
        {children}
      </Link>
    );
  };

  const WishlistButton = ({ className = "" }: { className?: string }) => (
    <button
      onClick={handleToggleWishlist}
      className={`bg-white p-2.5 rounded-full transition-all duration-200 shadow-lg hover:scale-110 ${
        wishlisted
          ? "text-red-500 hover:bg-red-100"
          : "text-gray-700 hover:bg-violet-600 hover:text-white"
      } ${className}`}
      aria-label="Toggle wishlist"
    >
      <Heart
        className={`w-4 h-4 ${
          wishlisted ? "fill-red-500" : "fill-transparent"
        }`}
      />
    </button>
  );

  return (
    <CardWrapper>
      <div
        className={`group bg-white/95 backdrop-blur rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-200/80 transition-all duration-500 border border-purple-100 hover:border-purple-300 relative flex flex-col h-full ${className}`}
      >
        {isNavigating && (
          <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="text-white text-xs font-semibold">
                Loading...
              </span>
            </div>
          </div>
        )}
        <div className="relative overflow-hidden bg-linear-to-br from-purple-50 via-white to-purple-100/40 h-48">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute bottom-3 right-3 z-10 flex gap-2 md:hidden">
            <WishlistButton />
          </div>

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-linear-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-md">
              -{discount}% OFF
            </div>
          )}

          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-purple-600 px-3 py-1 text-xs font-bold rounded-full shadow-sm border border-purple-100">
            {tag}
          </div>

          <div className="absolute inset-0 z-10 hidden md:flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
            <WishlistButton />
            <button
              onClick={(e) => e.preventDefault()}
              className="bg-white text-gray-700 p-2.5 rounded-full hover:bg-violet-600 hover:text-white transition-all shadow-lg hover:scale-110"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col grow">
          <div className="flex items-center gap-1 mb-2">
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

          <h3 className="font-semibold text-base text-gray-900 mb-1 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
            {name}
          </h3>

          <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-tight grow">
            {description}
          </p>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-bold text-gray-900">
              {formattedPrice}
            </span>
            {formattedOriginal && (
              <span className="text-sm text-gray-400 line-through">
                {formattedOriginal}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </CardWrapper>
  );
}
