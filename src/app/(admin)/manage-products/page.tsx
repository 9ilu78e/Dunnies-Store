"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Plus,
  Edit,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import AddProductModal from "./AddProductModal/AddProductModal";
import DeleteModal from "@/components/ui/DeleteModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  createdAt: string;
}

type StockFilter = "all" | "in" | "low" | "out";
type SortKey = "newest" | "oldest" | "price-high" | "price-low" | "name" | "stock-low";

const LOW_STOCK_LIMIT = 5;

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

const stockState = (qty: number): Exclude<StockFilter, "all"> =>
  qty <= 0 ? "out" : qty <= LOW_STOCK_LIMIT ? "low" : "in";

const stockBadge = {
  in: { label: "In stock", chip: "bg-white/90 text-emerald-600", dot: "bg-emerald-500" },
  low: { label: "Low stock", chip: "bg-white/90 text-amber-600", dot: "bg-amber-500" },
  out: { label: "Out of stock", chip: "bg-white/90 text-rose-600", dot: "bg-rose-500" },
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 w-3/4 rounded-full bg-gray-100" />
        <div className="h-3 w-full rounded-full bg-gray-100" />
        <div className="h-5 w-1/3 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openDeleteModal = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/products/${deleteModal.productId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((p) => p.id !== deleteModal.productId));
      setDeleteModal({ isOpen: false, productId: null, productName: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  /* summary ---------------------------------------------------------- */
  const summary = useMemo(() => {
    let value = 0;
    let low = 0;
    let out = 0;
    for (const p of products) {
      value += (p.price || 0) * Math.max(0, p.stockQuantity || 0);
      const s = stockState(p.stockQuantity || 0);
      if (s === "low") low++;
      if (s === "out") out++;
    }
    return { total: products.length, value, low, out };
  }, [products]);

  /* filtering + sorting ---------------------------------------------- */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (stockFilter !== "all" && stockState(p.stockQuantity || 0) !== stockFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });

    const time = (p: Product) => new Date(p.createdAt).getTime() || 0;
    return list.sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return time(a) - time(b);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "stock-low":
          return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        default:
          return time(b) - time(a);
      }
    });
  }, [products, search, stockFilter, sortKey]);

  const filtersActive = search.trim() !== "" || stockFilter !== "all";

  const filterChips: { key: StockFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: summary.total },
    { key: "in", label: "In stock", count: summary.total - summary.low - summary.out },
    { key: "low", label: "Low stock", count: summary.low },
    { key: "out", label: "Out of stock", count: summary.out },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Manage inventory, pricing, and product details
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Toolbar */}
      {!loading && products.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description"
                className="w-full rounded-full bg-gray-50 border border-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort products"
              className="rounded-full bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price-high">Price: high to low</option>
              <option value="price-low">Price: low to high</option>
              <option value="name">Name: A to Z</option>
              <option value="stock-low">Stock: lowest first</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterChips.map((c) => (
              <button
                key={c.key}
                onClick={() => setStockFilter(c.key)}
                aria-pressed={stockFilter === c.key}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
                  stockFilter === c.key
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {c.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    stockFilter === c.key ? "bg-white/25" : "bg-white text-gray-500"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <>
          <div className="sr-only">
            <Loader text="Loading products..." />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <ImageIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No products yet
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create your first product
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl bg-white border border-gray-100 text-center p-12">
          <Search className="w-10 h-10 text-purple-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">No products match your filters</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Try a different search term or stock filter.
          </p>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStockFilter("all");
              }}
              className="rounded-full border-2 border-purple-200 text-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-50 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {visible.length} of {products.length} products
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map((product) => {
              const state = stockState(product.stockQuantity || 0);
              const badge = stockBadge[state];
              return (
                <div
                  key={product.id}
                  className="group flex flex-col rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:border-purple-100 transition"
                >
                  <div className="relative h-36 bg-linear-to-br from-purple-100 to-pink-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          state === "out" ? "grayscale opacity-80" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-9 h-9 text-purple-300" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${badge.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-3.5">
                    <h3
                      className="text-sm font-bold text-gray-900 line-clamp-1"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {product.description || "No description"}
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg font-bold leading-none bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {naira(product.price || 0)}
                        </p>
                        <p className="mt-1.5 text-[11px] text-gray-500">
                          {product.stockQuantity} units
                          {" · "}
                          {new Date(product.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingProductId(product.id)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          aria-label={`Delete ${product.name}`}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
      />

      {editingProductId && (
        <AddProductModal
          isOpen={true}
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSuccess={() => {
            fetchProducts();
            setEditingProductId(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        itemName={deleteModal.productName}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, productId: null, productName: "" })
        }
      />
    </div>
  );
}