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
  Share2,
  Star,
  Loader,
} from "lucide-react";
import { ProductRecord } from "@/Data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { getBaseUrl } from "@/utils/url";

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
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [userId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("userId") : null
  );

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await fetch(
          `${getBaseUrl()}/api/products/${product.id}/comments`
        );
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          setAverageRating(data.averageRating || 0);
          setTotalComments(data.totalComments || 0);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [product.id]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        setLoadingLikes(true);
        const url = new URL(`${getBaseUrl()}/api/products/${product.id}/likes`);
        if (userId) url.searchParams.set("userId", userId);
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likeCount || 0);
          setIsLiked(data.isLikedByUser || false);
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
      } finally {
        setLoadingLikes(false);
      }
    };

    fetchLikes();
  }, [product.id, userId]);

  const handleToggleLike = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${getBaseUrl()}/api/products/${product.id}/likes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likeCount);
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const wishlisted = isInWishlist(product.id);

  const stockLabel = useMemo(() => {
    switch (product.stockStatus) {
      case "in-stock":
        return "In stock";
      case "low-stock":
        return "Low stock";
      default:
        return "Currently unavailable";
    }
  }, [product.stockStatus]);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
    });
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
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!comment.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/products/${product.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            text: comment,
            rating,
          }),
        }
      );

      if (response.ok) {
        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setComment("");
        setRating(5);

        const updatedComments = [newComment, ...comments];
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
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/product"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-square rounded-3xl bg-white border border-gray-200 overflow-hidden" style={{ maxHeight: "500px" }}>
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
            <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-3">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <p className="text-4xl font-bold text-gray-900">
              ₦{Number(product.price).toLocaleString()}
            </p>
            {product.originalPrice && (
              <p className="text-lg text-gray-400 line-through">
                ₦{Number(product.originalPrice).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span>·</span>
            <span>{product.reviewsCount}+ reviews</span>
            <span>·</span>
            <span
              className={
                product.stockStatus === "out-of-stock"
                  ? "text-red-500 font-semibold"
                  : "text-green-600 font-semibold"
              }
            >
              {stockLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-2">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="text-gray-600 px-2 text-xl"
              >
                –
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="text-gray-600 px-2 text-xl"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition"
            >
              Add to cart
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy link
                </>
              )}
            </button>
            <button
              onClick={handleToggleLike}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                isLiked
                  ? "bg-red-50 border border-red-300 text-red-700 hover:bg-red-100"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likes}</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Product details
            </h3>
            <p className="text-gray-600">{product.longDescription}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-start gap-3 text-sm text-gray-700"
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
                  className="flex justify-between text-sm text-gray-600 border-b border-gray-100 py-2"
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

      <div className="rounded-3xl bg-white border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
              Community
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Reviews & comments
            </h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            <Share2 className="w-4 h-4" />
            Share feedback
          </button>
        </div>

        <form
          onSubmit={handleReviewSubmit}
          className="rounded-2xl border border-gray-200 p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-600">Your rating:</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="text-amber-400"
                >
                  <Star
                    className={`w-5 h-5 ${
                      rating >= value ? "fill-current" : "fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-purple-500 focus:outline-none"
            rows={3}
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-5 py-2.5 font-semibold hover:bg-purple-700 transition"
          >
            <MessageSquare className="w-4 h-4" />
            Post comment
          </button>
        </form>

        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500">
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
                  <span className="font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({totalComments}{" "}
                    {totalComments === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
              {comments.map((review: any) => (
                <div
                  key={review.id}
                  className="border border-gray-100 rounded-2xl p-4 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-purple-600">
                      {review.user?.fullName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-semibold text-gray-900">
                        {review.user?.fullName || "Anonymous"}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {[...Array(review.rating)].map((_, index) => (
                        <Star key={index} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm">{review.text}</p>
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
