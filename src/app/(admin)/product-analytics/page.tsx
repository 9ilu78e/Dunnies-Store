"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Heart, Loader2 } from "lucide-react";
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

export default function ProductAnalytics() {
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductAnalytics | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null
  );

  const fetchProductAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      const productsWithAnalytics = data.products || [];


      const analyticsData = await Promise.all(
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
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader text="Loading product analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Product Analytics
        </h1>
        <p className="text-gray-600 text-lg mt-2">
          View comments, ratings, and engagement metrics for your products
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <MessageSquare className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No product comments or likes yet
          </p>
          <p className="text-gray-500 text-sm">
            User engagement will appear here once customers interact with your
            products
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedProductId(
                    expandedProductId === product.productId
                      ? null
                      : product.productId
                  )
                }
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="text-left flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {product.productName}
                  </h3>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {product.totalComments} comments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {product.totalLikes} likes
                      </span>
                    </div>
                    {product.averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          {product.averageRating.toFixed(1)} avg rating
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Loader2
                  className={`w-5 h-5 text-purple-600 transition-transform ${
                    expandedProductId === product.productId ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedProductId === product.productId && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                  {product.totalComments > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Comments ({product.totalComments})
                      </h4>
                      <div className="space-y-4">
                        {product.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {comment.user.fullName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < comment.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {comment.rating}/5
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.totalLikes > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" />
                        Total Likes: {product.totalLikes}
                      </h4>
                      <p className="text-sm text-gray-600">
                        This product has been liked by {product.totalLikes} user
                        {product.totalLikes !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
