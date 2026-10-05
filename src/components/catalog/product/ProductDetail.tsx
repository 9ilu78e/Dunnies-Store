"use client";

import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { ProductRecord } from "@/Data/products";
import type { CatalogItemType } from "@/context/CartContext";
import type { GiftContentSelection } from "@/lib/giftContents";
import type { AvailableGiftProduct } from "../gift/GiftDetailsPanel";
import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
  getVariantKind,
  readSizeVariants,
} from "@/lib/sizeVariants";
import ProductDetailView from "./ProductDetailView";
import { useProductDetailEngagement } from "./useProductDetailEngagement";
import { useProductPurchaseActions } from "./useProductPurchaseActions";

type ProductDetailProps = {
  product: ProductRecord;
  itemType?: CatalogItemType;
  detailsContent?: ReactNode;
};

export default function ProductDetail({
  product,
  itemType = "product",
  detailsContent,
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [availableGiftProducts, setAvailableGiftProducts] = useState<
    AvailableGiftProduct[]
  >([]);
  const [selectedGiftContents, setSelectedGiftContents] = useState<
    GiftContentSelection[]
  >([]);
  const [giftProductsLoading, setGiftProductsLoading] = useState(false);
  const [giftProductsError, setGiftProductsError] = useState("");
  const [giftCategoryFilter, setGiftCategoryFilter] = useState("");
  const [giftProductSearch, setGiftProductSearch] = useState("");
  const [editingGiftContentIndex, setEditingGiftContentIndex] = useState<
    number | null
  >(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availableStock, setAvailableStock] = useState(product.stockQuantity);
  const {
    user,
    isAuthenticated,
    authLoading,
    copied,
    likes,
    isLiked,
    loadingLikes,
    togglingLike,
    wishlisted,
    handleToggleLike,
    handleWishlistToggle,
    handleCopyLink,
  } = useProductDetailEngagement(product);

  useEffect(() => {
    if (itemType !== "gift") return;

    let cancelled = false;
    setSelectedGiftContents(
      (product.includedProducts ?? []).map((content) => ({ ...content }))
    );
    setGiftProductsLoading(true);
    setGiftProductsError("");

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || "Could not load products for this gift"
          );
        }
        if (!cancelled) {
          setAvailableGiftProducts(
            (data.products || []).map(
              (
                availableProduct: AvailableGiftProduct & {
                  category?: { name?: string } | null;
                }
              ) => ({
                ...availableProduct,
                categoryName:
                  availableProduct.category?.name || "Uncategorized",
                sizeVariants: readSizeVariants(availableProduct.sizeVariants),
              })
            )
          );
          setSelectedGiftContents((current) =>
            current.map((content) => {
              const availableProduct = (data.products || []).find(
                (item: AvailableGiftProduct) => item.id === content.productId
              );
              if (!availableProduct) return content;
              const variants = readSizeVariants(availableProduct.sizeVariants);
              if (
                !variants.length ||
                variants.some(
                  (variant) =>
                    variant.size.toUpperCase() === content.size?.toUpperCase()
                )
              ) {
                return content;
              }
              const firstAvailableVariant = variants.find(
                (variant) => variant.stockQuantity > 0
              );
              return firstAvailableVariant
                ? { ...content, size: firstAvailableVariant.size }
                : content;
            })
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setGiftProductsError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load products for this gift"
          );
        }
      } finally {
        if (!cancelled) setGiftProductsLoading(false);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [itemType, product.id, product.includedProducts]);

  const sizeVariants = product.sizeVariants ?? [];
  const variantKind = getVariantKind(sizeVariants);
  const variantName = getVariantKindLabel(variantKind).toLowerCase();
  const selectedVariant = sizeVariants.find(
    (variant) => variant.size.toUpperCase() === selectedSize.toUpperCase()
  );
  const isCustomizableGift = itemType === "gift";
  const giftProductCategories = useMemo(
    () =>
      [...new Set(availableGiftProducts.map((item) => item.categoryName))].sort(
        (left, right) => left.localeCompare(right)
      ),
    [availableGiftProducts]
  );
  const defaultGiftProductChoice = (productId: string) => {
    const productChoice = availableGiftProducts.find(
      (item) => item.id === productId
    );
    const firstAvailableVariant = readSizeVariants(
      productChoice?.sizeVariants
    ).find((variant) => variant.stockQuantity > 0);
    return firstAvailableVariant
      ? { productId, quantity: 1, size: firstAvailableVariant.size }
      : { productId, quantity: 1 };
  };
  const visibleGiftProducts = availableGiftProducts.filter((item) => {
    const isSelectedElsewhere = selectedGiftContents.some(
      (content, index) =>
        content.productId === item.id && index !== editingGiftContentIndex
    );
    const isBeingEdited =
      editingGiftContentIndex !== null &&
      selectedGiftContents[editingGiftContentIndex]?.productId === item.id;
    return (
      (item.stockQuantity > 0 || isBeingEdited) &&
      !isSelectedElsewhere &&
      (!giftCategoryFilter || item.categoryName === giftCategoryFilter) &&
      item.name.toLowerCase().includes(giftProductSearch.trim().toLowerCase())
    );
  });

  const chooseGiftProduct = (productId: string) => {
    const choice = defaultGiftProductChoice(productId);
    setSelectedGiftContents((current) =>
      editingGiftContentIndex === null
        ? [...current, choice]
        : current.map((item, index) =>
            index === editingGiftContentIndex ? choice : item
          )
    );
    setEditingGiftContentIndex(null);
    setAvailableStock(selectedVariant?.stockQuantity ?? product.stockQuantity);
  };
  const selectedGiftProductDetails = selectedGiftContents.map((content) => {
    const selectedProduct = availableGiftProducts.find(
      (availableProduct) => availableProduct.id === content.productId
    );
    const productSizes = selectedProduct
      ? readSizeVariants(selectedProduct.sizeVariants)
      : [];
    const selectedProductSize = productSizes.find(
      (variant) =>
        variant.size.toUpperCase() === (content.size ?? "").toUpperCase()
    );
    const availableProductStock = selectedProduct
      ? productSizes.length > 0
        ? selectedProductSize?.stockQuantity ?? 0
        : selectedProduct.stockQuantity
      : 0;
    const currentPrice = selectedProduct
      ? selectedProduct.flashSalePrice !== null &&
        selectedProduct.flashSaleEndsAt !== null &&
        new Date(selectedProduct.flashSaleEndsAt).getTime() > Date.now()
        ? selectedProduct.flashSalePrice
        : selectedProduct.price
      : 0;
    return {
      ...content,
      product: selectedProduct,
      productSizes,
      availableStock: availableProductStock,
      price: currentPrice,
      isValid:
        Boolean(selectedProduct) &&
        content.quantity > 0 &&
        availableProductStock >= content.quantity &&
        (productSizes.length === 0 || Boolean(selectedProductSize)),
    };
  });
  const giftBundlePrice = selectedGiftProductDetails.reduce(
    (total, content) => total + content.price * content.quantity,
    product.extraPrice ?? 0
  );
  const giftBundleStock = selectedGiftProductDetails.reduce(
    (stock, content) =>
      Math.min(stock, Math.floor(content.availableStock / content.quantity)),
    Number.MAX_SAFE_INTEGER
  );
  const giftContentsValid =
    selectedGiftContents.length > 0 &&
    selectedGiftProductDetails.every((content) => content.isValid);
  const baseItemStock =
    sizeVariants.length > 0
      ? selectedSize
        ? availableStock ?? selectedVariant?.stockQuantity ?? 0
        : 0
      : availableStock ?? product.stockQuantity;
  const stockQuantity =
    isCustomizableGift && giftProductsLoading
      ? 0
      : isCustomizableGift
      ? Math.min(baseItemStock ?? 0, giftBundleStock)
      : baseItemStock;
  const isStockAvailable = isCustomizableGift
    ? Boolean(
        giftContentsValid && (stockQuantity === undefined || stockQuantity > 0)
      )
    : sizeVariants.length > 0
    ? Boolean(selectedSize && selectedVariant && (stockQuantity ?? 0) > 0)
    : stockQuantity === undefined
    ? product.stockStatus !== "out-of-stock"
    : stockQuantity > 0;
  const stockLabel = useMemo(() => {
    if (sizeVariants.length > 0 && !selectedSize) {
      return `Choose a ${variantName}`;
    }
    if (isCustomizableGift && giftProductsLoading) return "Loading gift items";
    if (isCustomizableGift && !giftContentsValid) {
      const requiresSize = selectedGiftProductDetails.some(
        (content) =>
          content.productSizes.length > 0 &&
          !content.size &&
          content.productSizes.some((variant) => variant.stockQuantity > 0)
      );
      return requiresSize ? "Choose product sizes" : "Choose gift items";
    }
    if (!isStockAvailable) return "Out of stock";
    if (stockQuantity === undefined) {
      return product.stockStatus === "low-stock" ? "Low stock" : "In stock";
    }
    if (stockQuantity <= 5) return `Low stock · ${stockQuantity} left`;
    return `In stock · ${stockQuantity} available`;
  }, [
    isStockAvailable,
    isCustomizableGift,
    product.stockStatus,
    giftContentsValid,
    giftProductsLoading,
    selectedGiftProductDetails,
    selectedSize,
    sizeVariants.length,
    variantName,
    stockQuantity,
  ]);

  const { handleAddToCart, handleOrderWhatsApp } = useProductPurchaseActions({
    product,
    itemType,
    sizeVariants,
    selectedSize,
    variantName,
    quantity,
    selectedImage,
    isCustomizableGift,
    giftContentsValid,
    selectedGiftContents,
    selectedGiftProductDetails,
    isAuthenticated,
    customerName: user?.displayName,
    setAvailableStock,
  });

  return (
    <ProductDetailView
      product={product}
      itemType={itemType}
      detailsContent={detailsContent}
      selectedImage={selectedImage}
      setSelectedImage={setSelectedImage}
      handleWishlistToggle={handleWishlistToggle}
      wishlisted={wishlisted}
      isCustomizableGift={isCustomizableGift}
      giftProductsLoading={giftProductsLoading}
      giftBundlePrice={giftBundlePrice}
      giftPanelProps={{
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
      }}
      sizeVariants={sizeVariants}
      variantName={variantName}
      selectedSize={selectedSize}
      setSelectedSize={setSelectedSize}
      setAvailableStock={setAvailableStock}
      setQuantity={setQuantity}
      selectedVariant={selectedVariant}
      isStockAvailable={isStockAvailable}
      giftContentsValid={giftContentsValid}
      stockLabel={stockLabel}
      quantity={quantity}
      stockQuantity={stockQuantity}
      handleAddToCart={handleAddToCart}
      handleOrderWhatsApp={handleOrderWhatsApp}
      handleCopyLink={handleCopyLink}
      copied={copied}
      handleToggleLike={handleToggleLike}
      authLoading={authLoading}
      loadingLikes={loadingLikes}
      togglingLike={togglingLike}
      isLiked={isLiked}
      likes={likes}
    />
  );
}
