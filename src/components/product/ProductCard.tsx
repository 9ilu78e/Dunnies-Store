"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  LoaderCircle,
  MessageCircle,
  ShoppingCart,
  Star,
  StarHalf,
} from "lucide-react";
import Image from "next/image";
import { useCart, type CatalogItemType } from "@/context/CartContext";
import { showToast } from "@/components/ui/Toast";
import { useWishlist } from "@/hooks/useWishlist";
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
  stockQuantity?: number;
  orderCount?: number;
  href?: string;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  rating = 0,
  reviews = 0,
  image,
  discount = 0,
  stockQuantity,
  href = "#",
  className = "",
  priority = false,
}: ProductProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [imageFailed, setImageFailed] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const isUnavailablePlaceholder = image?.includes("via.placeholder.com");
  const displayImage =
    image && !imageFailed && !isUnavailablePlaceholder ? image : "";
  const normalizedRating = Math.round(Math.max(0, Math.min(5, rating)) * 2) / 2;
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars === 0.5;
  const formattedPrice = `₦${Number(price).toLocaleString()}`;
  const formattedOriginal =
    typeof originalPrice === "number" && originalPrice > price
      ? `₦${Number(originalPrice).toLocaleString()}`
      : null;
  const discountPercent =
    typeof originalPrice === "number" && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Math.max(0, discount);

  const computedHref =
    href && href !== "#"
      ? href
      : typeof id === "string"
      ? `/product/${id}`
      : "#";
  const itemType: CatalogItemType = computedHref.startsWith("/gift/")
    ? "gift"
    : computedHref.startsWith("/souvenirs/")
    ? "souvenir"
    : "product";
  const isWishlisted = isInWishlist(id);
  const whatsappHref = getWhatsAppLink("09056453575", {
    whatsappNumber: "09056453575",
    productName: name,
    productPrice: price,
    productQuantity: 1,
    productImage: image,
    productLink:
      typeof window === "undefined"
        ? `https://dunnisstores.com${computedHref}`
        : `${window.location.origin}${computedHref}`,
  });

  const handleToggleWishlist = () => {
    toggleWishlist({ id, name, price, image, href: computedHref });
    showToast(
      isWishlisted ? "Removed from wishlist." : "Added to wishlist.",
      "success"
    );
  };

  const handleWhatsAppOrder = () => {
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      const response = await fetch("/api/cart/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: String(id), itemType }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to check item availability");
      }

      const availableItem = data.items?.[0] as
        | {
            stockQuantity: number;
            price: number;
            giftContents?: Parameters<typeof addToCart>[0]["giftContents"];
          }
        | undefined;
      if (!availableItem) {
        throw new Error("This item is no longer available");
      }
      if (availableItem.stockQuantity < 1) {
        if (stockQuantity && stockQuantity > 0 && computedHref !== "#") {
          showToast(
            "Choose an available size or volume before adding this item.",
            "warning"
          );
          router.push(computedHref);
        } else {
          showToast("This item is out of stock.", "warning");
        }
        return;
      }

      const added = addToCart({
        id,
        itemType,
        name,
        price: availableItem.price,
        image: image || "",
        stockQuantity: availableItem.stockQuantity,
        ...(availableItem.giftContents?.length
          ? { giftContents: availableItem.giftContents }
          : {}),
      });
      if (!added) {
        showToast("This item is out of stock.", "warning");
        return;
      }
      showToast("Added to your cart.", "success");
    } catch (error) {
      console.error("Unable to add item from product card:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Could not add this item to your cart. Please try again.",
        "error"
      );
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div
      className={`group relative flex h-full min-w-0 w-full flex-col ${className}`}
    >
      <Link
        href={computedHref === "#" ? "#" : computedHref}
        className="block"
        aria-label={`View ${name}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name}
              width={400}
              height={300}
              priority={priority}
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-sm font-medium text-gray-400">
                No image
              </span>
            </div>
          )}

          <div className="absolute left-2 top-2">
            {discountPercent > 0 && (
              <span className="rounded-full bg-purple-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                -{discountPercent}%
              </span>
            )}
          </div>
          <span
            className={`absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ${
              typeof stockQuantity !== "number"
                ? "bg-white/95 text-gray-600"
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

        <div className="flex min-h-7 items-center gap-1.5 px-2 pt-2">
          <div
            className="flex items-center gap-px"
            aria-label={`${rating.toFixed(1)} out of 5 stars`}
          >
            {[...Array(5)].map((_, i) => {
              const starClass =
                i < fullStars || (i === fullStars && hasHalfStar)
                  ? "h-3 w-3 fill-amber-500 text-amber-500"
                  : "h-3 w-3 fill-gray-200 text-gray-200";

              return i === fullStars && hasHalfStar ? (
                <StarHalf key={`star-${id}-${i}`} className={starClass} />
              ) : (
                <Star key={`star-${id}-${i}`} className={starClass} />
              );
            })}
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {rating.toFixed(1)} ({reviews})
          </span>
        </div>

        <div className="rounded-b-2xl bg-gray-50 px-2 pb-3 pt-1">
          <span className="block min-h-10 line-clamp-2 text-sm font-medium leading-5 text-gray-800 transition-colors group-hover:text-purple-700">
            {name}
          </span>

          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-bold leading-5 text-gray-950">
              {formattedPrice}
            </span>
            {formattedOriginal && (
              <span className="text-xs text-gray-400 line-through">
                {formattedOriginal}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleToggleWishlist}
        aria-label={
          isWishlisted
            ? `Remove ${name} from wishlist`
            : `Add ${name} to wishlist`
        }
        aria-pressed={isWishlisted}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:scale-105 hover:text-rose-600"
      >
        <Heart
          className={`h-5 w-5 ${
            isWishlisted ? "fill-rose-500 text-rose-500" : ""
          }`}
        />
      </button>
      <div className="grid grid-cols-2 gap-2 rounded-b-2xl bg-gray-50 px-2 pb-2 pt-1">
        <button
          type="button"
          onClick={handleWhatsAppOrder}
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl border border-green-700 bg-white px-2 py-2 text-[11px] font-semibold text-green-800 transition hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart || stockQuantity === 0}
          className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-purple-700 px-2 py-2 text-[11px] font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {addingToCart ? (
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {addingToCart ? "Adding..." : "Add to cart"}
          </span>
        </button>
      </div>
    </div>
  );
}
