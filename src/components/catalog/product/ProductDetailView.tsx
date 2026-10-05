"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Star,
  ShoppingCart,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction, ComponentProps } from "react";
import type { ProductRecord } from "@/Data/products";
import type { CatalogItemType } from "@/context/CartContext";
import type { SizeVariant } from "@/lib/sizeVariants";
import { formatVariantChoice } from "@/lib/sizeVariants";
import ProductReviews from "../shared/ProductReviews";
import RelatedProducts from "../shared/RelatedProducts";
import GiftDetailsPanel from "../gift/GiftDetailsPanel";
import ProductSpecifications from "../shared/ProductSpecifications";

type GiftPanelProps = Omit<
  ComponentProps<typeof GiftDetailsPanel>,
  "product" | "isCustomizableGift"
>;

type ProductDetailViewProps = {
  product: ProductRecord;
  itemType: CatalogItemType;
  detailsContent?: ReactNode;
  selectedImage: string;
  setSelectedImage: Dispatch<SetStateAction<string>>;
  handleWishlistToggle: () => void;
  wishlisted: boolean;
  isCustomizableGift: boolean;
  giftProductsLoading: boolean;
  giftBundlePrice: number;
  giftPanelProps: GiftPanelProps;
  sizeVariants: SizeVariant[];
  variantName: string;
  selectedSize: string;
  setSelectedSize: Dispatch<SetStateAction<string>>;
  setAvailableStock: Dispatch<SetStateAction<number | undefined>>;
  setQuantity: Dispatch<SetStateAction<number>>;
  selectedVariant?: SizeVariant;
  isStockAvailable: boolean;
  giftContentsValid: boolean;
  stockLabel: string;
  quantity: number;
  stockQuantity?: number;
  handleAddToCart: () => void;
  handleOrderWhatsApp: () => void;
  handleCopyLink: () => void;
  copied: boolean;
  handleToggleLike: () => void;
  authLoading: boolean;
  loadingLikes: boolean;
  togglingLike: boolean;
  isLiked: boolean;
  likes: number;
};

export default function ProductDetailView({
  product,
  itemType,
  detailsContent,
  selectedImage,
  setSelectedImage,
  handleWishlistToggle,
  wishlisted,
  isCustomizableGift,
  giftProductsLoading,
  giftBundlePrice,
  giftPanelProps,
  sizeVariants,
  variantName,
  selectedSize,
  setSelectedSize,
  setAvailableStock,
  setQuantity,
  selectedVariant,
  isStockAvailable,
  giftContentsValid,
  stockLabel,
  quantity,
  stockQuantity,
  handleAddToCart,
  handleOrderWhatsApp,
  handleCopyLink,
  copied,
  handleToggleLike,
  authLoading,
  loadingLikes,
  togglingLike,
  isLiked,
  likes,
}: ProductDetailViewProps) {
  return (
    <div className="space-y-8">
      <Link
        href="/product"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-purple-600"
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div
            className="relative aspect-square rounded-3xl bg-white border border-gray-200 overflow-hidden"
            style={{ maxHeight: "500px" }}
          >
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <button
              onClick={handleWishlistToggle}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow-lg hover:scale-105 transition"
              aria-label="Toggle wishlist"
            >
              <Heart
                className={`w-5 h-5 ${
                  wishlisted ? "text-red-500 fill-red-500" : "text-gray-700"
                }`}
              />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images.map((image) => (
              <button
                key={image}
                onClick={() => setSelectedImage(image)}
                className={`relative aspect-square rounded-2xl overflow-hidden border ${
                  selectedImage === image
                    ? "border-purple-500"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                {product.tag}
              </span>
              <span className="text-xs text-gray-500">{product.category}</span>
            </div>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              {product.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              ₦
              {Number(
                isCustomizableGift && !giftProductsLoading
                  ? giftBundlePrice
                  : product.price
              ).toLocaleString()}
            </p>
            {!isCustomizableGift && product.originalPrice && (
              <p className="text-sm sm:text-base text-gray-400 line-through">
                ₦{Number(product.originalPrice).toLocaleString()}
              </p>
            )}
          </div>

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <dt>Delivery:</dt>
              <dd className="font-medium text-gray-700">
                {typeof product.deliveryFee === "number" &&
                product.deliveryFee > 0
                  ? `₦${product.deliveryFee.toLocaleString()}`
                  : "Pending"}
              </dd>
            </div>
            {isCustomizableGift && (
              <div className="flex items-center gap-1">
                <dt>Packing &amp; box:</dt>
                <dd className="font-medium text-gray-700">
                  ₦{(product.extraPrice ?? 0).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
          {isCustomizableGift && (
            <GiftDetailsPanel
              product={product}
              isCustomizableGift={isCustomizableGift}
              {...giftPanelProps}
            />
          )}
          {sizeVariants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-gray-900">
                Choose a {variantName}
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizeVariants.map((variant) => {
                  const isAvailable = variant.stockQuantity > 0;
                  const isSelected =
                    selectedSize.toUpperCase() === variant.size.toUpperCase();
                  return (
                    <button
                      key={variant.size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(variant.size);
                        setAvailableStock(variant.stockQuantity);
                        setQuantity(1);
                      }}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      className={`min-w-16 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:border-purple-400"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {formatVariantChoice(variant.size)}
                      <span className="mt-0.5 block text-[10px] font-normal">
                        {isAvailable
                          ? `${variant.stockQuantity} in stock`
                          : "Sold out"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span>·</span>
            <span>{product.reviewsCount}+ reviews</span>
            <span>·</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isStockAvailable
                  ? "bg-green-50 text-green-700"
                  : isCustomizableGift &&
                    (giftProductsLoading || !giftContentsValid)
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {stockLabel}
            </span>
            <span>·</span>
            <div className="flex items-center border border-gray-200 rounded-full px-1.5 sm:px-2 md:px-3 py-1">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="text-gray-600 px-0.5 sm:px-1 text-xs sm:text-sm md:text-base"
                title="Decrease quantity"
              >
                –
              </button>
              <span className="w-5 sm:w-6 text-center font-semibold text-xs">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((prev) =>
                    stockQuantity === undefined
                      ? prev + 1
                      : Math.min(prev + 1, stockQuantity)
                  )
                }
                className="text-gray-600 px-0.5 sm:px-1 text-xs sm:text-sm md:text-base"
                title="Increase quantity"
                disabled={
                  stockQuantity !== undefined && quantity >= stockQuantity
                }
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 md:gap-4 w-full">
              <button
                onClick={handleAddToCart}
                disabled={!isStockAvailable}
                className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-purple-600 text-white px-3.5 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-semibold hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:bg-gray-400"
                title={
                  !isStockAvailable
                    ? "This product is out of stock"
                    : "Add this product to your cart"
                }
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                <span className="shrink-0">Add to cart</span>
              </button>

              <button
                onClick={handleOrderWhatsApp}
                disabled={!isStockAvailable}
                className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-green-600 text-white px-3.5 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-semibold hover:bg-green-700 transition disabled:cursor-not-allowed disabled:bg-gray-400"
                title="Order via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                <span className="shrink-0">Order via WhatsApp</span>
              </button>
            </div>

            <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-2 md:gap-3 w-full">
              <button
                onClick={handleCopyLink}
                className="inline-flex flex-row items-center justify-center gap-1 rounded-full border border-gray-300 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                title="Copy product link"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 shrink-0" />
                    <span className="shrink-0">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="shrink-0">Share link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleLike}
                disabled={authLoading || loadingLikes || togglingLike}
                className={`inline-flex flex-row items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                  isLiked
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                title="Like this product"
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
                <span className="shrink-0">{likes}</span>
              </button>
            </div>
          </div>

          {detailsContent ??
            (!isCustomizableGift ? (
              <ProductSpecifications
                product={product}
                title={
                  itemType === "souvenir"
                    ? "Souvenir details"
                    : "Product details"
                }
              />
            ) : null)}
        </div>
      </div>

      <RelatedProducts product={product} />

      <ProductReviews
        productId={product.id}
        copied={copied}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
}
