"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader, MessageSquare, Share2, Star, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getBaseUrl } from "@/utils/url";

type Review = {
  id: string;
  text: string;
  rating: number;
  createdAt: string;
  user?: { id: string; fullName: string };
  likeCount?: number;
  isLiked?: boolean;
};

export default function ProductReviews({
  productId,
  copied,
  onCopyLink,
}: {
  productId: string;
  copied: boolean;
  onCopyLink: () => void;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [comments, setComments] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [commentLikes, setCommentLikes] = useState<
    Record<string, { count: number; isLiked: boolean }>
  >({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoadError, setCommentsLoadError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentNotice, setCommentNotice] = useState("");
  const [animatingCommentId, setAnimatingCommentId] = useState<string | null>(
    null
  );

  useEffect(() => setIsClient(true), []);

  const redirectToLogin = () => {
    sessionStorage.setItem(
      "dunnis:returnTo",
      `${window.location.pathname}${window.location.search}`
    );
    router.push("/login");
  };

  useEffect(() => {
    if (!isClient || authLoading) return;
    let cancelled = false;
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/products/${productId}/comments`,
          { credentials: "same-origin", cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`Review request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;
        const fetchedComments: Review[] = data.comments || [];
        setComments(fetchedComments);
        setAverageRating(data.averageRating || 0);
        setTotalComments(data.totalComments || 0);
        setCommentLikes(
          Object.fromEntries(
            fetchedComments.map((comment) => [
              comment.id,
              {
                count: comment.likeCount || 0,
                isLiked: comment.isLiked || false,
              },
            ])
          )
        );
        setCommentsLoadError("");
      } catch (error) {
        console.error("Error fetching comments:", error);
        if (!cancelled) {
          setCommentsLoadError(
            "Reviews could not be loaded. Please refresh the page to try again."
          );
        }
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    };
    void fetchComments();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isClient, productId, user?.uid]);

  const handleReviewSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isAdmin) {
      alert("Admin users cannot comment on products");
      return;
    }
    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/products/${productId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ text: newComment, rating: newRating }),
        }
      );
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        const postedComment = data.comment as Review;
        const updatedComments = [postedComment, ...comments];
        setComments(updatedComments);
        setCommentLikes((current) => ({
          ...current,
          [postedComment.id]: { count: 0, isLiked: false },
        }));
        setNewComment("");
        setNewRating(5);
        setCommentError("");
        setCommentNotice("Your comment and rating have been posted.");
        setAverageRating(
          Math.round(
            (updatedComments.reduce((sum, comment) => sum + comment.rating, 0) /
              updatedComments.length) *
              10
          ) / 10
        );
        setTotalComments(updatedComments.length);
      } else {
        const data = await response.json().catch(() => ({}));
        setCommentError(data.error || "Could not post your review.");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      setCommentError("Could not post your review. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }
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
        redirectToLogin();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCommentLikes((current) => ({
          ...current,
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

  return (
    <section className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Community
          </p>
          <h2 className="text-sm sm:text-lg font-bold text-gray-900">
            Reviews &amp; comments
          </h2>
        </div>
        <button
          onClick={onCopyLink}
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
            onChange={(event) => setNewComment(event.target.value)}
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
            {comments.map((review) => (
              <article
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
                        animatingCommentId === review.id
                          ? "animate-bounce"
                          : ""
                      }`}
                    />
                    <span>{commentLikes[review.id]?.count || 0}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
