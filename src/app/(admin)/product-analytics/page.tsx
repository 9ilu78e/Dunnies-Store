"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star,
  MessageSquare,
  Heart,
  ChevronDown,
  Search,
  RefreshCw,
  Download,
  Package,
  TrendingUp,
  AlertCircle,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import Loader from "@/components/ui/Loader";

interface ProductComment {
  id: string;
  text: string;
  rating: number;
  user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

interface ProductLike {
  id: string;
  userId: string;
  createdAt: string;
}

interface ProductAnalytics {
  productId: string;
  productName: string;
  comments: ProductComment[];
  likes: ProductLike[];
  totalComments: number;
  totalLikes: number;
  averageRating: number;
}

type SortKey = "engagement" | "likes" | "comments" | "top-rated" | "low-rated";
type FilterKey = "all" | "top" | "low" | "unrated";
type CommentSort = "newest" | "highest" | "lowest";

const RATINGS = [5, 4, 3, 2, 1] as const;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "engagement", label: "Most engaged" },
  { value: "likes", label: "Most liked" },
  { value: "comments", label: "Most commented" },
  { value: "top-rated", label: "Highest rated" },
  { value: "low-rated", label: "Lowest rated" },
];

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "top", label: "Loved (4.0+)" },
  { value: "low", label: "Needs attention (<3.0)" },
  { value: "unrated", label: "No ratings" },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const distributionOf = (comments: ProductComment[]) => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const comment of comments) {
    const rating = Math.round(comment.rating);
    if (rating >= 1 && rating <= 5) counts[rating] += 1;
  }
  return counts;
};

const sentimentOf = (product: ProductAnalytics) => {
  if (product.averageRating <= 0)
    return { label: "No ratings", className: "bg-gray-100 text-gray-600" };
  if (product.averageRating >= 4)
    return { label: "Loved", className: "bg-emerald-100 text-emerald-700" };
  if (product.averageRating >= 3)
    return { label: "Mixed", className: "bg-amber-100 text-amber-700" };
  return { label: "Needs attention", className: "bg-red-100 text-red-700" };
};

function Stars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-gray-500 sm:text-sm">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function RatingBars({
  counts,
  compact = false,
}: {
  counts: Record<number, number>;
  compact?: boolean;
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {RATINGS.map((rating) => {
        const count = counts[rating] ?? 0;
        const pct = total ? (count / total) * 100 : 0;
        return (
          <li key={rating} className="flex items-center gap-2 text-xs sm:gap-3">
            <span className="flex w-7 shrink-0 items-center gap-0.5 font-semibold text-gray-700">
              {rating}
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className="block h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right tabular-nums text-gray-500">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProductAnalytics() {
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("engagement");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [commentSort, setCommentSort] = useState<CommentSort>("newest");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const fetchProductAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      const productsWithAnalytics = data.products || [];

      const analyticsData: ProductAnalytics[] = await Promise.all(
        productsWithAnalytics.map(async (product: any) => {
          try {
            const [commentsRes, likesRes] = await Promise.all([
              fetch(`/api/products/${product.id}/comments`),
              fetch(`/api/products/${product.id}/likes`),
            ]);

            const commentsData = commentsRes.ok
              ? await commentsRes.json()
              : { comments: [], averageRating: 0 };
            const likesData = likesRes.ok
              ? await likesRes.json()
              : { likeCount: 0 };

            return {
              productId: product.id,
              productName: product.name,
              comments: commentsData.comments || [],
              totalComments: commentsData.totalComments || 0,
              averageRating: commentsData.averageRating || 0,
              likes: [],
              totalLikes: likesData.likeCount || 0,
            };
          } catch {
            return {
              productId: product.id,
              productName: product.name,
              comments: [],
              totalComments: 0,
              averageRating: 0,
              likes: [],
              totalLikes: 0,
            };
          }
        })
      );

      setProducts(
        analyticsData.filter((p) => p.totalComments > 0 || p.totalLikes > 0)
      );
    } catch (err) {
      console.error("Unable to load product analytics:", err);
      setError(
        "We could not load product analytics. Check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchProductAnalytics();
  }, [fetchProductAnalytics]);

  const deleteComment = async (productId: string, comment: ProductComment) => {
    if (
      !window.confirm(
        "Delete this comment and its rating? This cannot be undone."
      )
    ) {
      return;
    }

    setDeletingCommentId(comment.id);
    setError("");
    try {
      const response = await fetch(`/api/products/${productId}/comments`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this comment.");
      }

      setProducts((current) =>
        current
          .map((product) => {
            if (product.productId !== productId) return product;
            const comments = product.comments.filter(
              (item) => item.id !== comment.id
            );
            return {
              ...product,
              comments,
              totalComments: Math.max(0, product.totalComments - 1),
              averageRating: comments.length
                ? comments.reduce((sum, item) => sum + item.rating, 0) /
                  comments.length
                : 0,
            };
          })
          .filter(
            (product) => product.totalComments > 0 || product.totalLikes > 0
          )
      );
    } catch (deleteError) {
      console.error("Unable to delete product comment:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this comment."
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  /* ----------------------------- derived data ----------------------------- */

  const summary = useMemo(() => {
    const allComments = products.flatMap((p) => p.comments);
    const distribution = distributionOf(allComments);
    const ratedCount = Object.values(distribution).reduce((s, n) => s + n, 0);
    const ratingSum = RATINGS.reduce((s, r) => s + r * distribution[r], 0);
    return {
      totalProducts: products.length,
      totalComments: products.reduce((s, p) => s + p.totalComments, 0),
      totalLikes: products.reduce((s, p) => s + p.totalLikes, 0),
      averageRating: ratedCount ? ratingSum / ratedCount : 0,
      ratedCount,
      distribution,
    };
  }, [products]);

  const engagementOf = (p: ProductAnalytics) => p.totalComments + p.totalLikes;
  const maxEngagement = useMemo(
    () => Math.max(1, ...products.map(engagementOf)),
    [products]
  );

  const topProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => engagementOf(b) - engagementOf(a))
        .slice(0, 5),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (q && !p.productName.toLowerCase().includes(q)) return false;
      if (filterKey === "top") return p.averageRating >= 4;
      if (filterKey === "low")
        return p.averageRating > 0 && p.averageRating < 3;
      if (filterKey === "unrated") return p.averageRating <= 0;
      return true;
    });
    const sorters: Record<SortKey, (a: ProductAnalytics, b: ProductAnalytics) => number> =
      {
        engagement: (a, b) => engagementOf(b) - engagementOf(a),
        likes: (a, b) => b.totalLikes - a.totalLikes,
        comments: (a, b) => b.totalComments - a.totalComments,
        "top-rated": (a, b) => b.averageRating - a.averageRating,
        "low-rated": (a, b) => {
          const av = a.averageRating > 0 ? a.averageRating : 99;
          const bv = b.averageRating > 0 ? b.averageRating : 99;
          return av - bv;
        },
      };
    return filtered.sort(sorters[sortKey]);
  }, [products, query, filterKey, sortKey]);

  const sortComments = (comments: ProductComment[]) => {
    const list = [...comments];
    if (commentSort === "highest") return list.sort((a, b) => b.rating - a.rating);
    if (commentSort === "lowest") return list.sort((a, b) => a.rating - b.rating);
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const exportCsv = () => {
    const escape = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ["Product", "Comments", "Likes", "Average rating"],
      ...visibleProducts.map((p) => [
        p.productName,
        p.totalComments,
        p.totalLikes,
        p.averageRating ? p.averageRating.toFixed(2) : "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = query.trim() !== "" || filterKey !== "all";

  /* -------------------------------- render -------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader text="Loading product analytics..." />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            Product Analytics
          </h1>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-lg">
            Comments, ratings and engagement across your products
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={visibleProducts.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void fetchProductAnalytics(true)}
            disabled={refreshing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-60 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void fetchProductAnalytics()}
            className="self-start rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm hover:bg-red-100 sm:self-auto"
          >
            Try again
          </button>
        </div>
      )}

      {products.length === 0 && !error ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-8 text-center sm:p-12">
          <MessageSquare className="mx-auto mb-4 h-14 w-14 text-purple-300 sm:h-16 sm:w-16" />
          <p className="mb-2 text-base font-semibold text-gray-700 sm:text-lg">
            No product comments or likes yet
          </p>
          <p className="mx-auto max-w-md text-sm text-gray-500">
            User engagement will appear here once customers interact with your
            products
          </p>
        </div>
      ) : (
        products.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <KpiCard
                icon={Package}
                label="Products with activity"
                value={summary.totalProducts.toLocaleString()}
                tone="bg-violet-100 text-violet-700"
              />
              <KpiCard
                icon={MessageSquare}
                label="Total comments"
                value={summary.totalComments.toLocaleString()}
                tone="bg-blue-100 text-blue-700"
              />
              <KpiCard
                icon={Heart}
                label="Total likes"
                value={summary.totalLikes.toLocaleString()}
                tone="bg-rose-100 text-rose-700"
              />
              <KpiCard
                icon={Star}
                label="Average rating"
                value={
                  summary.averageRating ? summary.averageRating.toFixed(1) : "–"
                }
                hint={
                  summary.ratedCount
                    ? `From ${summary.ratedCount.toLocaleString()} ${
                        summary.ratedCount === 1 ? "review" : "reviews"
                      }`
                    : "No ratings yet"
                }
                tone="bg-amber-100 text-amber-700"
              />
            </div>

            {/* Insights */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
              <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
                <h2 className="text-base font-bold text-gray-900">
                  Rating distribution
                </h2>
                <p className="mb-4 mt-0.5 text-xs text-gray-500">
                  How customers rate across all products
                </p>
                <RatingBars counts={summary.distribution} />
              </section>

              <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-3">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Top products by engagement
                    </h2>
                    <p className="text-xs text-gray-500">Comments plus likes</p>
                  </div>
                </div>
                <ol className="space-y-3.5">
                  {topProducts.map((product, index) => {
                    const score = engagementOf(product);
                    return (
                      <li key={product.productId} className="min-w-0">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                              {index + 1}
                            </span>
                            <span className="truncate font-semibold text-gray-900">
                              {product.productName}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                            {score}
                          </span>
                        </div>
                        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-gray-100">
                          <span
                            className="block h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600"
                            style={{ width: `${(score / maxEngagement) * 100}%` }}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:flex">
                <select
                  value={filterKey}
                  onChange={(event) => setFilterKey(event.target.value as FilterKey)}
                  aria-label="Filter by rating"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:text-sm"
                >
                  {FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  aria-label="Sort products"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="-mt-3 text-xs text-gray-500 sm:-mt-4">
              Showing {visibleProducts.length} of {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilterKey("all");
                  }}
                  className="ml-2 inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </p>

            {/* Product list */}
            {visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No products match your filters.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {visibleProducts.map((product, index) => {
                  const expanded = expandedProductId === product.productId;
                  const sentiment = sentimentOf(product);
                  const score = engagementOf(product);
                  const panelId = `analytics-panel-${product.productId}`;
                  const distribution = distributionOf(product.comments);

                  return (
                    <div
                      key={product.productId}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedProductId(expanded ? null : product.productId)
                        }
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50 sm:items-center sm:gap-4 sm:p-5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700 sm:h-9 sm:w-9">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h3 className="min-w-0 break-words text-base font-bold text-gray-900">
                              {product.productName}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sentiment.className}`}
                            >
                              {sentiment.label}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-700">
                            <span className="inline-flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <strong>{product.totalComments}</strong>
                              <span className="text-gray-500">
                                {product.totalComments === 1 ? "comment" : "comments"}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Heart className="h-4 w-4 text-rose-600" />
                              <strong>{product.totalLikes}</strong>
                              <span className="text-gray-500">
                                {product.totalLikes === 1 ? "like" : "likes"}
                              </span>
                            </span>
                            {product.averageRating > 0 && (
                              <span className="inline-flex items-center gap-1.5">
                                <Stars value={product.averageRating} size="w-3.5 h-3.5" />
                                <strong>{product.averageRating.toFixed(1)}</strong>
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <span
                                className="block h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600"
                                style={{ width: `${(score / maxEngagement) * 100}%` }}
                              />
                            </span>
                            <span className="text-[11px] font-semibold tabular-nums text-gray-500">
                              {score} engagement
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`mt-1 h-5 w-5 shrink-0 text-violet-600 transition-transform sm:mt-0 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expanded && (
                        <div
                          id={panelId}
                          className="space-y-6 border-t border-gray-200 bg-gray-50 p-4 sm:p-6"
                        >
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-white p-4 text-center ring-1 ring-gray-200">
                              <p className="text-3xl font-black text-gray-900">
                                {product.averageRating > 0
                                  ? product.averageRating.toFixed(1)
                                  : "–"}
                              </p>
                              <div className="mt-1 flex justify-center">
                                <Stars value={product.averageRating} />
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                Average rating
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200 sm:col-span-2">
                              <p className="mb-2 text-xs font-semibold text-gray-500">
                                Rating breakdown
                              </p>
                              <RatingBars counts={distribution} compact />
                            </div>
                          </div>

                          {product.totalComments > 0 && (
                            <div>
                              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="flex items-center gap-2 font-bold text-gray-900">
                                  <MessageSquare className="h-5 w-5 text-blue-600" />
                                  Comments ({product.totalComments})
                                </h4>
                                <select
                                  value={commentSort}
                                  onChange={(event) =>
                                    setCommentSort(event.target.value as CommentSort)
                                  }
                                  aria-label="Sort comments"
                                  className="self-start rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-violet-500 sm:self-auto"
                                >
                                  <option value="newest">Newest first</option>
                                  <option value="highest">Highest rated</option>
                                  <option value="lowest">Lowest rated</option>
                                </select>
                              </div>
                              <ul className="space-y-3">
                                {sortComments(product.comments).map((comment) => (
                                  <li
                                    key={comment.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                                          {(comment.user.fullName || "?")
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-gray-900">
                                            {comment.user.fullName}
                                          </p>
                                          <div className="mt-0.5 flex items-center gap-2">
                                            <Stars value={comment.rating} size="w-3.5 h-3.5" />
                                            <span className="text-xs text-gray-500">
                                              {comment.rating}/5
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <time
                                          dateTime={comment.createdAt}
                                          className="text-xs text-gray-500"
                                        >
                                          {formatDate(comment.createdAt)}
                                        </time>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void deleteComment(
                                              product.productId,
                                              comment
                                            )
                                          }
                                          disabled={
                                            deletingCommentId === comment.id
                                          }
                                          aria-label={`Delete comment by ${comment.user.fullName}`}
                                          title="Delete comment"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {deletingCommentId === comment.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="mt-3 break-words text-sm leading-relaxed text-gray-700">
                                      {comment.text}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {product.totalLikes > 0 && (
                            <div className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <Heart className="h-5 w-5" />
                              </span>
                              <p className="text-sm text-gray-700">
                                <strong className="text-gray-900">
                                  {product.totalLikes}
                                </strong>{" "}
                                {product.totalLikes === 1 ? "user has" : "users have"}{" "}
                                liked this product
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}