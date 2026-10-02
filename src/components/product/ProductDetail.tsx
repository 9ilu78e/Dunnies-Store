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

type ProductDetailProps = {
  product: ProductRecord;
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

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
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

  const stockQuantity = availableStock ?? product.stockQuantity;
  const isStockAvailable =
    stockQuantity === undefined
      ? product.stockStatus !== "out-of-stock"
      : stockQuantity > 0;
  const stockLabel = useMemo(() => {
    if (!isStockAvailable) return "Out of stock";
    if (stockQuantity === undefined) {
      return product.stockStatus === "low-stock" ? "Low stock" : "In stock";
    }
    if (stockQuantity <= 5) return `Low stock · ${stockQuantity} left`;
    return `In stock · ${stockQuantity} available`;
  }, [isStockAvailable, product.stockStatus, stockQuantity]);

  const fetchCurrentAvailability = async () => {
    const response = await fetch("/api/cart/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: [product.id] }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to check product stock");
    }
    const current = data.products.find(
      (item: { id: string; stockQuantity: number; price: number }) =>
        item.id === product.id
    ) as { id: string; stockQuantity: number; price: number } | undefined;
    return current;
  };

  const handleAddToCart = async () => {
    try {
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
          name: product.name,
          price: current.price,
          image: selectedImage,
          stockQuantity: current.stockQuantity,
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
        productName: product.name,
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
            <p className="text-xs sm:text-sm text-gray-600 mt-3">
              {product.description}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              ₦{Number(product.price).toLocaleString()}
            </p>
            {product.originalPrice && (
              <p className="text-sm sm:text-base text-gray-400 line-through">
                ₦{Number(product.originalPrice).toLocaleString()}
              </p>
            )}
          </div>

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
                    availableStock === undefined
                      ? prev + 1
                      : Math.min(prev + 1, availableStock)
                  )
                }
                className="text-gray-600 px-0.5 sm:px-1 text-xs sm:text-sm md:text-base"
                title="Increase quantity"
                disabled={
                  availableStock !== undefined && quantity >= availableStock
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

          <div className="rounded-3xl bg-white border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              Product details
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {product.longDescription}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-start gap-3 text-xs sm:text-sm text-gray-700"
                >
                  <Check className="w-4 h-4 text-green-500 mt-1" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex justify-between text-xs sm:text-sm text-gray-600 border-b border-gray-100 py-2"
                >
                  <span className="font-medium text-gray-800">
                    {spec.label}
                  </span>
                  <span>{spec.value}</span>
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
