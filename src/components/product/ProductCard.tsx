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
  name,
  description,
  price,
  originalPrice,
  rating = 0,
  reviews = 0,
  image,
  tag,
  discount = 0,
  href = "#",
  className = "",
}: ProductProps) {
  const router = useRouter();
  if (!image) {
    console.log(`[ProductCard] ${name}: No image provided!`);
  }
  const displayImage = image || "";
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
        className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-300 relative flex flex-col h-full min-w-[280px] max-w-[320px] ${className}`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-[4/3] w-full h-48">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              width={400}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Image failed to load - fallback to placeholder
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/400x400?text=No+Image";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm font-medium">
                No Image
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {tag && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 text-[11px] font-bold rounded-full shadow-lg">
              {tag}
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-400 text-white px-3 py-1 text-[11px] font-bold rounded-full shadow-lg">
              -{discount}%
            </div>
          )}

          <button
            onClick={handleToggleWishlist}
            className={`absolute ${
              tag ? "top-12" : "top-3"
            } right-3 p-2 rounded-full transition-all duration-200 hover:scale-110 ${
              wishlisted
                ? "bg-red-500/90 text-white shadow-lg"
                : "bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 shadow-md hover:shadow-lg"
            }`}
            aria-label="Toggle wishlist"
            title="Add to Wishlist"
          >
            <Heart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
          </button>

          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <button
              onClick={handleOrderWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-2.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-sm bg-opacity-95 text-xs font-semibold"
              aria-label="Order on WhatsApp"
              title="Order on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order</span>
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-2.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-sm bg-opacity-95 text-xs font-semibold"
              aria-label="Add to cart"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
            </button>
          </div>
        </div>

        <div className="p-3 flex flex-col grow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`star-${id}-${i}`}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 fill-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-gray-600 bg-yellow-50 px-2 py-0.5 rounded-full">
              {rating.toFixed(1)}
            </span>
          </div>

          <h3 className="font-semibold text-xs text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
            {name}
          </h3>

          {description && (
            <p className="text-gray-400 text-[10px] mb-2 line-clamp-1 leading-relaxed">
              {description}
            </p>
          )}

          <div className="grow"></div>

          <div className="pt-3 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-purple-600">
                  {formattedPrice}
                </span>
                {formattedOriginal && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formattedOriginal}
                  </span>
                )}
              </div>
              {reviews > 0 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  {reviews} reviews
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
