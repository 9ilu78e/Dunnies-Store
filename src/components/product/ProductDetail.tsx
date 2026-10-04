"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  MessageSquare,
  MessageCircle,
  Share2,
  Star,
  Loader,
  ThumbsUp,
  ShoppingCart,
} from "lucide-react";
import { ProductRecord } from "@/Data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { getBaseUrl } from "@/utils/url";
import { useAuth } from "@/hooks/useAuth";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { showToast } from "@/components/ui/Toast";
import type { CatalogItemType } from "@/context/CartContext";
import type {
  GiftContentSelection,
  GiftContentSnapshot,
} from "@/lib/giftContents";
import { giftContentsKey } from "@/lib/giftContents";
import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
  getVariantKind,
  readSizeVariants,
} from "@/lib/sizeVariants";

type ProductDetailProps = {
  product: ProductRecord;
  itemType?: CatalogItemType;
};

type Comment = {
  id: string;
  text: string;
  rating: number;
  user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
};

type AvailableGiftProduct = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  imageUrls: string[];
  sizeVariants: unknown;
  flashSalePrice: number | null;
  flashSaleEndsAt: string | null;
};

export default function ProductDetail({
  product,
  itemType = "product",
}: ProductDetailProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [availableGiftProducts, setAvailableGiftProducts] = useState<
    AvailableGiftProduct[]
  >([]);
  const [selectedGiftContents, setSelectedGiftContents] = useState<
    GiftContentSelection[]
  >([]);
  const [giftProductsLoading, setGiftProductsLoading] = useState(false);
  const [giftProductsError, setGiftProductsError] = useState("");
  const [newGiftProductId, setNewGiftProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availableStock, setAvailableStock] = useState(product.stockQuantity);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoadError, setCommentsLoadError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentNotice, setCommentNotice] = useState("");
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [commentLikes, setCommentLikes] = useState<
    Record<string, { count: number; isLiked: boolean }>
  >({});
  const [animatingCommentId, setAnimatingCommentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (itemType !== "gift" || !product.includedProducts?.length) return;

    let cancelled = false;
    setSelectedGiftContents(
      product.includedProducts.map((content) => ({ ...content }))
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
              (availableProduct: AvailableGiftProduct) => ({
                ...availableProduct,
                sizeVariants: readSizeVariants(availableProduct.sizeVariants),
              })
            )
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

  const redirectToLogin = () => {
    sessionStorage.setItem(
      "dunnis:returnTo",
      `${window.location.pathname}${window.location.search}`
    );
    router.push("/login");
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await fetch(
          `${getBaseUrl()}/api/products/${product.id}/comments`,
          { credentials: "same-origin", cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(
            `Review request failed with status ${response.status}`
          );
        }
        const data = await response.json();
        setComments(data.comments || []);
        setAverageRating(data.averageRating || 0);
        setTotalComments(data.totalComments || 0);

        const likesMap: Record<string, { count: number; isLiked: boolean }> =
          {};
        (data.comments || []).forEach(
          (comment: Comment & { likeCount?: number; isLiked?: boolean }) => {
            likesMap[comment.id] = {
              count: comment.likeCount || 0,
              isLiked: comment.isLiked || false,
            };
          }
        );
        setCommentLikes(likesMap);
        setCommentsLoadError("");
      } catch (error) {
        console.error("Error fetching comments:", error);
        setCommentsLoadError(
          "Reviews could not be loaded. Please refresh the page to try again."
        );
      } finally {
        setLoadingComments(false);
      }
    };

    if (isClient && !authLoading) {
      fetchComments();
    }
  }, [product.id, user?.uid, isClient, authLoading]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        setLoadingLikes(true);
        const url = new URL(`${getBaseUrl()}/api/products/${product.id}/likes`);
        if (user?.uid) url.searchParams.set("userId", user.uid);
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likeCount || 0);
          setIsLiked(data.isLikedByUser || false);
        } else {
          setLikes(0);
          setIsLiked(false);
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
        setLikes(0);
        setIsLiked(false);
      } finally {
        setLoadingLikes(false);
      }
    };

    if (isClient) {
      fetchLikes();
    }
  }, [product.id, user?.uid, isClient]);

  const handleToggleLike = async () => {
    if (authLoading) {
      return;
    }

    if (isAdmin) {
      alert("Admin users cannot like products");
      return;
    }

    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }

    try {
      setTogglingLike(true);
      const response = await fetch(
        `${getBaseUrl()}/api/products/${product.id}/likes`,
        {
          method: "POST",
        }
      );
      if (response.status === 401) {
        // Token expired or invalid
        redirectToLogin();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likeCount || 0);
        setIsLiked(data.liked || false);
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setTogglingLike(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }

    // Trigger animation
    setAnimatingCommentId(commentId);
    setTimeout(() => setAnimatingCommentId(null), 600);

    try {
      const response = await fetch(`${getBaseUrl()}/api/comments/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ commentId }),
      });

      if (response.status === 401) {
        // Token expired or invalid
        redirectToLogin();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: {
            count: data.likeCount || 0,
            isLiked: data.liked,
          },
        }));
      } else {
        console.error("Failed to toggle comment like");
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const wishlisted = isInWishlist(product.id);

  const sizeVariants = product.sizeVariants ?? [];
  const variantKind = getVariantKind(sizeVariants);
  const variantName = getVariantKindLabel(variantKind).toLowerCase();
  const selectedVariant = sizeVariants.find(
    (variant) => variant.size.toUpperCase() === selectedSize.toUpperCase()
  );
  const isCustomizableGift =
    itemType === "gift" && (product.includedProducts?.length ?? 0) > 0;
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
    0
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
      return "Choose available gift items";
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
    selectedSize,
    sizeVariants.length,
    variantName,
    stockQuantity,
  ]);

  const fetchCurrentAvailability = async (
    size = selectedSize,
    giftContents: GiftContentSelection[] = isCustomizableGift
      ? selectedGiftContents
      : []
  ) => {
    const response = await fetch("/api/cart/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            id: product.id,
            itemType,
            ...(size ? { size } : {}),
            ...(isCustomizableGift ? { giftContents } : {}),
          },
        ],
      }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to check product stock");
    }
    const current = data.items.find(
      (item: {
        id: string;
        itemType: CatalogItemType;
        stockQuantity: number;
        price: number;
        size?: string;
        giftContents?: GiftContentSnapshot[];
      }) =>
        item.id === product.id &&
        item.itemType === itemType &&
        item.size === (size || undefined)
    ) as
      | {
          id: string;
          itemType: CatalogItemType;
          stockQuantity: number;
          price: number;
          size?: string;
          giftContents?: GiftContentSnapshot[];
        }
      | undefined;
    return current;
  };

  const handleAddToCart = async () => {
    try {
      if (sizeVariants.length > 0 && !selectedSize) {
        showToast(
          `Choose a ${variantName} before adding this item to your cart.`,
          "warning"
        );
        return;
      }
      if (isCustomizableGift && !giftContentsValid) {
        showToast(
          "Choose an available product, quantity, and any required size for every gift item.",
          "warning"
        );
        return;
      }
      const current = await fetchCurrentAvailability();
      if (!current || current.stockQuantity < 1) {
        setAvailableStock(0);
        showToast("This product is out of stock.", "warning");
        return;
      }
      setAvailableStock(current.stockQuantity);
      const added = addToCart(
        {
          id: product.id,
          itemType,
          name: product.name,
          price: current.price,
          image: selectedImage,
          stockQuantity: current.stockQuantity,
          ...(selectedSize ? { size: selectedSize } : {}),
          ...(current.giftContents?.length
            ? { giftContents: current.giftContents }
            : {}),
        },
        quantity
      );
      if (!added) {
        showToast(
          "Your cart quantity cannot exceed the available stock.",
          "warning"
        );
        return;
      }
      showToast("Product added to your cart.", "success");
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      showToast("Could not verify stock. Please try again.", "error");
    }
  };

  const handleOrderWhatsApp = async () => {
    if (sizeVariants.length > 0 && !selectedSize) {
      showToast(
        `Choose a ${variantName} before placing your order.`,
        "warning"
      );
      return;
    }
    if (isCustomizableGift && !giftContentsValid) {
      showToast(
        "Choose an available product, quantity, and any required size for every gift item.",
        "warning"
      );
      return;
    }
    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      showToast("Allow pop-ups to continue to WhatsApp.", "warning");
      return;
    }
    try {
      const current = await fetchCurrentAvailability();
      if (!current || current.stockQuantity < quantity) {
        setAvailableStock(current?.stockQuantity ?? 0);
        whatsappWindow.close();
        showToast(
          "This product is no longer available in the requested quantity.",
          "warning"
        );
        return;
      }
      setAvailableStock(current.stockQuantity);
      const whatsappNumber = "09056453575";
      const productLink =
        typeof window !== "undefined"
          ? `${window.location.origin}${product.href}`
          : product.href;

      const whatsappLink = getWhatsAppLink(whatsappNumber, {
        productName: selectedSize
          ? `${product.name} (${getVariantKindLabel(
              variantKind
            )} ${formatVariantChoice(selectedSize)})`
          : product.name,
        ...(isCustomizableGift
          ? {
              productName: `${
                product.name
              }\nGift contents:\n${selectedGiftProductDetails
                .map(
                  (content) =>
                    `- ${content.product?.name || "Product"}${
                      content.size
                        ? ` (${getVariantKindLabel(
                            getVariantChoiceKind(content.size)
                          )} ${formatVariantChoice(content.size)})`
                        : ""
                    } × ${content.quantity}`
                )
                .join("\n")}`,
            }
          : {}),
        productPrice: current.price,
        productQuantity: quantity,
        productImage: selectedImage,
        productLink,
        ...(isAuthenticated && user?.displayName
          ? { customerName: user.displayName }
          : {}),
        whatsappNumber,
      });

      whatsappWindow.location.href = whatsappLink;
    } catch (error) {
      console.error("Unable to verify WhatsApp order stock:", error);
      whatsappWindow.close();
      showToast("Could not verify stock. Please try again.", "error");
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      href: product.href,
    });
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined" || !window?.location) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${product.href}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      alert("Admin users cannot comment on products");
      return;
    }

    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/products/${product.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            text: newComment,
            rating: newRating,
          }),
        }
      );

      if (response.status === 401) {
        // Token expired or invalid
        router.push("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const newCommentData = data.comment as Comment;
        setComments((current) => [newCommentData, ...current]);
        setCommentLikes((current) => ({
          ...current,
          [newCommentData.id]: { count: 0, isLiked: false },
        }));
        setNewComment("");
        setNewRating(5);
        setCommentError("");
        setCommentNotice("Your comment and rating have been posted.");

        const updatedComments = [newCommentData, ...comments];
        const avgRating =
          updatedComments.length > 0
            ? Math.round(
                (updatedComments.reduce(
                  (sum: number, c: any) => sum + c.rating,
                  0
                ) /
                  updatedComments.length) *
                  10
              ) / 10
            : 0;
        setAverageRating(avgRating);
        setTotalComments(updatedComments.length);
      } else {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        setCommentError(data.error || "Could not post your review.");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      setCommentError("Could not post your review. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

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

          {isCustomizableGift && (
            <section className="space-y-3 rounded-2xl border border-purple-100 bg-white p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Customise what’s inside
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Change the gift contents and quantities. The price updates
                  from the products you choose.
                </p>
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
                  <div className="space-y-3">
                    {selectedGiftProductDetails.map((content, index) => (
                      <div
                        key={`${content.productId}-${index}`}
                        className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_5rem_auto] sm:items-center"
                      >
                        <select
                          value={content.productId}
                          onChange={(event) => {
                            const nextProductId = event.target.value;
                            setSelectedGiftContents((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      productId: nextProductId,
                                      size: undefined,
                                    }
                                  : item
                              )
                            );
                            setAvailableStock(
                              selectedVariant?.stockQuantity ??
                                product.stockQuantity
                            );
                          }}
                          aria-label={`Gift item ${index + 1}`}
                          className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                        >
                          {availableGiftProducts
                            .filter(
                              (availableProduct) =>
                                availableProduct.stockQuantity > 0 ||
                                availableProduct.id === content.productId
                            )
                            .map((availableProduct) => (
                              <option
                                key={availableProduct.id}
                                value={availableProduct.id}
                              >
                                {availableProduct.name}
                                {availableProduct.stockQuantity <= 0
                                  ? " (out of stock)"
                                  : ""}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max={
                            content.productSizes.length > 0 && content.size
                              ? content.availableStock
                              : content.product?.stockQuantity
                          }
                          step="1"
                          value={content.quantity}
                          onChange={(event) => {
                            const quantity = Math.max(
                              1,
                              Number(event.target.value) || 1
                            );
                            setSelectedGiftContents((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, quantity }
                                  : item
                              )
                            );
                            setAvailableStock(
                              selectedVariant?.stockQuantity ??
                                product.stockQuantity
                            );
                          }}
                          aria-label={`Gift item ${index + 1} quantity`}
                          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGiftContents((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            );
                            setAvailableStock(
                              selectedVariant?.stockQuantity ??
                                product.stockQuantity
                            );
                          }}
                          className="justify-self-end rounded-lg p-2 text-sm text-red-600 hover:bg-red-50 sm:justify-self-auto"
                          aria-label={`Remove ${
                            content.product?.name || "gift item"
                          }`}
                        >
                          Remove
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
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none sm:col-span-3"
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
                        <div className="text-xs text-gray-500 sm:col-span-3">
                          {content.product
                            ? `₦${content.price.toLocaleString()} each`
                            : "Product unavailable"}
                          {content.availableStock < content.quantity &&
                            " · Not enough stock for this quantity"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={newGiftProductId}
                      onChange={(event) =>
                        setNewGiftProductId(event.target.value)
                      }
                      aria-label="Choose a product to add to this gift"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Choose another product</option>
                      {availableGiftProducts
                        .filter(
                          (availableProduct) =>
                            availableProduct.stockQuantity > 0 &&
                            !selectedGiftContents.some(
                              (content) =>
                                content.productId === availableProduct.id
                            )
                        )
                        .map((availableProduct) => (
                          <option
                            key={availableProduct.id}
                            value={availableProduct.id}
                          >
                            {availableProduct.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!newGiftProductId}
                      onClick={() => {
                        if (!newGiftProductId) return;
                        setSelectedGiftContents((current) => [
                          ...current,
                          { productId: newGiftProductId, quantity: 1 },
                        ]);
                        setNewGiftProductId("");
                        setAvailableStock(
                          selectedVariant?.stockQuantity ??
                            product.stockQuantity
                        );
                      }}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add product
                    </button>
                  </div>
                  <p className="text-xs font-medium text-gray-600">
                    Gift contents total: ₦{giftBundlePrice.toLocaleString()}
                  </p>
                </>
              )}
            </section>
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

          <div className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {itemType === "gift"
                ? "Gift details"
                : itemType === "souvenir"
                ? "Souvenir details"
                : "Product details"}
            </h3>
            {(product.longDescription || product.description) && (
              <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </h4>
                <p className="whitespace-pre-line break-words text-sm leading-7 text-gray-700">
                  {product.longDescription || product.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex min-w-0 flex-col gap-1 rounded-xl border border-gray-100 bg-white p-3 sm:p-4"
                >
                  <span className="text-xs font-medium text-gray-500">
                    {spec.label}
                  </span>
                  <span className="break-words text-sm font-semibold text-gray-900">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-widest">
              Community
            </p>
            <h2 className="text-sm sm:text-lg font-bold text-gray-900">
              Reviews & comments
            </h2>
          </div>
          <button
            onClick={handleCopyLink}
            className="inline-flex flex-row items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="shrink-0">{copied ? "Copied" : "Share link"}</span>
          </button>
        </div>

        {isClient && !isAdmin ? (
          <form
            onSubmit={handleReviewSubmit}
            className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-xs sm:text-sm text-gray-600">Your rating:</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        redirectToLogin();
                        return;
                      }
                      setNewRating(value);
                    }}
                    aria-label={`Rate ${value} out of 5 stars`}
                    className="transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        newRating >= value
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-gray-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => {
                if (!isAuthenticated && !authLoading) redirectToLogin();
              }}
              placeholder="Share your experience with this product..."
              maxLength={2000}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 sm:p-4 text-sm leading-relaxed focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              rows={3}
            />
            <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
              <span>Your review will appear here as soon as it is posted.</span>
              <span>{newComment.length}/2000</span>
            </div>
            {commentError && (
              <p role="alert" className="text-sm text-red-600">
                {commentError}
              </p>
            )}
            {commentNotice && (
              <p role="status" className="text-sm text-green-700">
                {commentNotice}
              </p>
            )}
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="inline-flex flex-row items-center gap-2 rounded-full bg-purple-600 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="shrink-0">
                {submittingComment ? "Posting..." : "Post comment"}
              </span>
            </button>
          </form>
        ) : null}

        <div className="space-y-4">
          {commentsLoadError ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {commentsLoadError}
            </p>
          ) : loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">
              Be the first to leave a review.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(Math.round(averageRating))].map((_, index) => (
                      <Star key={index} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    ({totalComments}{" "}
                    {totalComments === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
              {comments.map((review: any) => (
                <div
                  key={review.id}
                  className="border border-gray-100 rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-purple-600">
                      {review.user?.fullName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {review.user?.fullName || "Anonymous"}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm">
                      {[...Array(review.rating)].map((_, index) => (
                        <Star key={index} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {review.text}
                    </p>
                    <button
                      onClick={() => handleToggleCommentLike(review.id)}
                      aria-label={
                        commentLikes[review.id]?.isLiked
                          ? "Unlike this comment"
                          : "Like this comment"
                      }
                      className={`inline-flex flex-row items-center gap-1.5 text-xs mt-3 px-3 py-1.5 rounded-full transition font-medium ${
                        commentLikes[review.id]?.isLiked
                          ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          commentLikes[review.id]?.isLiked ? "fill-current" : ""
                        } ${
                          animatingCommentId === review.id
                            ? "thumbs-up-animate"
                            : ""
                        }`}
                      />
                      <span className="shrink-0">
                        {commentLikes[review.id]?.count || 0}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
