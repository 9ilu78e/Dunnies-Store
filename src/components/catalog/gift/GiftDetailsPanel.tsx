"use client";

import Image from "next/image";
import { Minus, Plus, Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ProductRecord } from "@/Data/products";
import type { GiftContentSelection } from "@/lib/giftContents";
import {
  formatVariantChoice,
  getVariantKind,
  getVariantKindLabel,
} from "@/lib/sizeVariants";
import type { SizeVariant } from "@/lib/sizeVariants";

export type AvailableGiftProduct = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  imageUrl: string | null;
  imageUrls: string[];
  sizeVariants: unknown;
  flashSalePrice: number | null;
  flashSaleEndsAt: string | null;
};

export type GiftProductDetail = GiftContentSelection & {
  product?: AvailableGiftProduct;
  productSizes: SizeVariant[];
  availableStock: number;
  price: number;
  isValid: boolean;
};

type GiftDetailsPanelProps = {
  product: ProductRecord;
  isCustomizableGift: boolean;
  giftProductsLoading: boolean;
  giftProductsError: string;
  giftBundlePrice: number;
  selectedGiftProductDetails: GiftProductDetail[];
  setSelectedGiftContents: Dispatch<SetStateAction<GiftContentSelection[]>>;
  editingGiftContentIndex: number | null;
  setEditingGiftContentIndex: Dispatch<SetStateAction<number | null>>;
  giftProductSearch: string;
  setGiftProductSearch: Dispatch<SetStateAction<string>>;
  giftProductCategories: string[];
  giftCategoryFilter: string;
  setGiftCategoryFilter: Dispatch<SetStateAction<string>>;
  visibleGiftProducts: AvailableGiftProduct[];
  chooseGiftProduct: (productId: string) => void;
  selectedVariant?: SizeVariant;
  setAvailableStock: Dispatch<SetStateAction<number | undefined>>;
};

export default function GiftDetailsPanel({
  product,
  isCustomizableGift,
  giftProductsLoading,
  giftProductsError,
  giftBundlePrice,
  selectedGiftProductDetails,
  setSelectedGiftContents,
  editingGiftContentIndex,
  setEditingGiftContentIndex,
  giftProductSearch,
  setGiftProductSearch,
  giftProductCategories,
  giftCategoryFilter,
  setGiftCategoryFilter,
  visibleGiftProducts,
  chooseGiftProduct,
  selectedVariant,
  setAvailableStock,
}: GiftDetailsPanelProps) {
  return (
    <>
          {isCustomizableGift && (
            <section className="space-y-4 rounded-2xl border border-purple-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Customise what’s inside
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    Choose the items you want. Your gift price updates as you
                    customise it.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  ₦{giftBundlePrice.toLocaleString()}
                </span>
              </div>

              {giftProductsLoading ? (
                <p className="text-sm text-gray-500">
                  Loading products in stock...
                </p>
              ) : giftProductsError ? (
                <p role="alert" className="text-sm text-red-700">
                  {giftProductsError}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {selectedGiftProductDetails.map((content, index) => (
                      <div
                        key={`${content.productId}-${index}`}
                        className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2"
                      >
                        {content.product?.imageUrls?.[0] ||
                        content.product?.imageUrl ? (
                          <Image
                            src={
                              content.product.imageUrls[0] ||
                              content.product.imageUrl ||
                              ""
                            }
                            alt={content.product.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] text-gray-400">
                            Item
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">
                            {content.product?.name || "Unavailable item"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {content.product
                              ? `₦${content.price.toLocaleString()} each`
                              : "Choose a replacement"}
                            {content.availableStock < content.quantity &&
                              " · Low stock"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center rounded-lg border border-gray-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedGiftContents((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        quantity: Math.max(
                                          1,
                                          item.quantity - 1
                                        ),
                                      }
                                    : item
                                )
                              )
                            }
                            aria-label={`Decrease ${
                              content.product?.name || "gift item"
                            } quantity`}
                            className="p-1.5 text-gray-600"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-5 text-center text-xs font-semibold">
                            {content.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedGiftContents((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        quantity: item.quantity + 1,
                                      }
                                    : item
                                )
                              )
                            }
                            aria-label={`Increase ${
                              content.product?.name || "gift item"
                            } quantity`}
                            className="p-1.5 text-gray-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingGiftContentIndex(index)}
                          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedGiftContents((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                          className="shrink-0 rounded-lg px-1.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${
                            content.product?.name || "gift item"
                          }`}
                        >
                          ×
                        </button>
                        {content.productSizes.length > 0 && (
                          <select
                            value={content.size ?? ""}
                            onChange={(event) => {
                              setSelectedGiftContents((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        size: event.target.value || undefined,
                                      }
                                    : item
                                )
                              );
                              setAvailableStock(
                                selectedVariant?.stockQuantity ??
                                  product.stockQuantity
                              );
                            }}
                            aria-label={`Gift item ${
                              index + 1
                            } ${getVariantKind(content.productSizes)}`}
                            className="max-w-28 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">
                              Choose{" "}
                              {getVariantKindLabel(
                                getVariantKind(content.productSizes)
                              ).toLowerCase()}
                            </option>
                            {content.productSizes.map((variant) => (
                              <option
                                key={variant.size}
                                value={variant.size}
                                disabled={variant.stockQuantity === 0}
                              >
                                {formatVariantChoice(variant.size)}
                                {variant.stockQuantity === 0
                                  ? " (sold out)"
                                  : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900">
                        {editingGiftContentIndex === null
                          ? "Add an item"
                          : `Replace item ${editingGiftContentIndex + 1}`}
                      </p>
                      {editingGiftContentIndex !== null && (
                        <button
                          type="button"
                          onClick={() => setEditingGiftContentIndex(null)}
                          className="text-xs font-semibold text-gray-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <Search className="h-4 w-4 shrink-0 text-gray-400" />
                      <input
                        type="search"
                        value={giftProductSearch}
                        onChange={(event) =>
                          setGiftProductSearch(event.target.value)
                        }
                        placeholder="Search items"
                        aria-label="Search gift items"
                        className="min-w-0 flex-1 text-sm outline-none"
                      />
                    </label>
                    <div
                      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
                      aria-label="Filter gift items by category"
                    >
                      {["", ...giftProductCategories].map((categoryName) => (
                        <button
                          key={categoryName || "all"}
                          type="button"
                          onClick={() => setGiftCategoryFilter(categoryName)}
                          aria-pressed={giftCategoryFilter === categoryName}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            giftCategoryFilter === categoryName
                              ? "bg-purple-700 text-white"
                              : "bg-white text-gray-600 ring-1 ring-gray-200"
                          }`}
                        >
                          {categoryName || "All"}
                        </button>
                      ))}
                    </div>
                    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {visibleGiftProducts.map((availableProduct) => {
                        const image =
                          availableProduct.imageUrls?.[0] ||
                          availableProduct.imageUrl;
                        return (
                          <button
                            key={availableProduct.id}
                            type="button"
                            onClick={() =>
                              chooseGiftProduct(availableProduct.id)
                            }
                            className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 text-left transition hover:border-purple-300 hover:bg-purple-50"
                          >
                            {image ? (
                              <Image
                                src={image}
                                alt=""
                                width={48}
                                height={48}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-gray-900">
                                {availableProduct.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                                ₦{availableProduct.price.toLocaleString()} ·{" "}
                                {availableProduct.categoryName}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      {visibleGiftProducts.length === 0 && (
                        <p className="col-span-2 py-4 text-center text-xs text-gray-500">
                          No available items in this category.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-600">
                    Gift total includes the extra charge.
                  </p>
                </>
              )}
            </section>
          )}
    </>
  );
}
