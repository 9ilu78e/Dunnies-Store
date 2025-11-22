"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Star, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getWhatsAppLink } from "@/lib/whatsapp";

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
  const router = useRouter();
  const displayImage =
    image && image.trim() !== ""
      ? image
      : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&auto=format";
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const formattedPrice = `₦${Number(price).toLocaleString()}`;
  const formattedOriginal = originalPrice
    ? `₦${Number(originalPrice).toLocaleString()}`
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image: displayImage });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id,
      name,
      price,
      image: displayImage,
      href: computedHref,
    });
  };

  const handleOrderWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "09056453575";
    const productLink =
      typeof window !== "undefined"
        ? `${window.location.origin}${computedHref}`
        : computedHref;

    const whatsappLink = getWhatsAppLink(whatsappNumber, {
      productName: name,
      productPrice: price,
      productQuantity: 1,
      productImage: displayImage,
      productLink,
      customerName: "Customer",
      whatsappNumber,
    });

    window.open(whatsappLink, "_blank");
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
    return <Link href={computedHref}>{children}</Link>;
  };

  return (
    <CardWrapper>
      <div
        className={`group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-500 relative flex flex-col h-full ${className}`}
      >
        {}
        <div className="relative overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 h-64 w-full">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

          {}
          {tag && (
            <div className="absolute top-4 left-4 bg-linear-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
              {tag}
            </div>
          )}

          {}
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-linear-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
              -{discount}%
            </div>
          )}

          {}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleOrderWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center backdrop-blur-sm bg-opacity-90"
              aria-label="Order on WhatsApp"
              title="Order on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddToCart}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center backdrop-blur-sm bg-opacity-90"
              aria-label="Add to cart"
              title="Add to Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {}
        <div className="p-5 flex flex-col grow">
          {}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`star-${id}-${i}`}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 fill-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-700 bg-yellow-50 px-2 py-0.5 rounded-full">
              {rating.toFixed(1)} ⭐
            </span>
          </div>

          {}
          <h3 className="font-bold text-base text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
            {name}
          </h3>

          {}
          <p className="text-gray-600 text-xs mb-3 line-clamp-1 leading-relaxed hidden sm:block">
            {description}
          </p>

          {}
          <div className="grow"></div>

          {}
          <div className="pt-4 border-t-2 border-gray-100">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-purple-600">
                  {formattedPrice}
                </span>
                {formattedOriginal && (
                  <span className="text-xs text-gray-400 line-through">
                    {formattedOriginal}
                  </span>
                )}
              </div>
              {}
              <button
                onClick={handleToggleWishlist}
                className={`p-2.5 rounded-full transition-all duration-200 shrink-0 shadow-md ${
                  wishlisted
                    ? "bg-red-500 text-white scale-110"
                    : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
                }`}
                aria-label="Toggle wishlist"
                title="Add to Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
