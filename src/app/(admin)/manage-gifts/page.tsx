"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Edit, Image as ImageIcon, Search } from "lucide-react";
import Loader from "@/components/ui/Loader";
import AddGiftModal from "./AddGiftModal/AddGiftModal";
import DeleteModal from "@/components/ui/DeleteModal";
import { showToast } from "@/components/ui/Toast";

interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  priority: string;
  flashSalePrice: number | null;
  imageUrl: string;
  imageUrls?: string[];
  createdAt: string;
}

type StockFilter = "all" | "in" | "low" | "out";
type SortKey = "newest" | "oldest" | "price-high" | "price-low" | "name" | "stock-low";
const LOW_STOCK_LIMIT = 5;

const stockState = (quantity: number): Exclude<StockFilter, "all"> =>
  quantity <= 0 ? "out" : quantity <= LOW_STOCK_LIMIT ? "low" : "in";

const stockBadge = {
  in: { label: "In stock", chip: "bg-white/90 text-emerald-600", dot: "bg-emerald-500" },
  low: { label: "Low stock", chip: "bg-white/90 text-amber-600", dot: "bg-amber-500" },
  out: { label: "Out of stock", chip: "bg-white/90 text-rose-600", dot: "bg-rose-500" },
};

const naira = (amount: number) => `₦${Math.round(amount).toLocaleString()}`;

export default function ManageGifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    giftId: string | null;
    giftName: string;
  }>({
    isOpen: false,
    giftId: null,
    giftName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gifts");
      if (!response.ok) throw new Error("Failed to fetch gifts");
      const data = await response.json();
      setGifts(data.gifts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gifts");
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const openDeleteModal = (gift: Gift) => {
    setDeleteModal({
      isOpen: true,
      giftId: gift.id,
      giftName: gift.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.giftId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/gifts/${deleteModal.giftId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete gift");
      setGifts(gifts.filter((g) => g.id !== deleteModal.giftId));
      setDeleteModal({ isOpen: false, giftId: null, giftName: "" });
      showToast(
        `Gift "${deleteModal.giftName}" deleted successfully!`,
        "success"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleGifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gifts
      .filter((gift) => {
        if (stockFilter !== "all" && stockState(gift.stockQuantity || 0) !== stockFilter) return false;
        return !query || gift.name.toLowerCase().includes(query) || gift.description.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime() || 0;
        const bDate = new Date(b.createdAt).getTime() || 0;
        switch (sortKey) {
          case "oldest": return aDate - bDate;
          case "price-high": return (b.price || 0) - (a.price || 0);
          case "price-low": return (a.price || 0) - (b.price || 0);
          case "name": return a.name.localeCompare(b.name);
          case "stock-low": return (a.stockQuantity || 0) - (b.stockQuantity || 0);
          default: return bDate - aDate;
        }
      });
  }, [gifts, search, stockFilter, sortKey]);
  const filtersActive = search.trim() !== "" || stockFilter !== "all";
  const filterChips: { key: StockFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: gifts.length },
    { key: "in", label: "In stock", count: gifts.filter((gift) => stockState(gift.stockQuantity || 0) === "in").length },
    { key: "low", label: "Low stock", count: gifts.filter((gift) => stockState(gift.stockQuantity || 0) === "low").length },
    { key: "out", label: "Out of stock", count: gifts.filter((gift) => stockState(gift.stockQuantity || 0) === "out").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gifts
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Manage gift products and inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Gift
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && gifts.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or description"
                className="w-full rounded-full bg-gray-50 border border-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              aria-label="Sort gifts"
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
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStockFilter(chip.key)}
                aria-pressed={stockFilter === chip.key}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
                  stockFilter === chip.key
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {chip.label}
                <span className={`rounded-full px-1.5 text-[11px] ${stockFilter === chip.key ? "bg-white/25" : "bg-white text-gray-500"}`}>
                  {chip.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader text="Loading gifts..." />
        </div>
      ) : gifts.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <ImageIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No gifts yet
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create your first gift
          </button>
        </div>
      ) : visibleGifts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-gray-100 text-center p-12">
          <Search className="w-10 h-10 text-purple-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">No gifts match your filters</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Try a different search term or stock filter.</p>
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
        <p className="text-sm text-gray-500">Showing {visibleGifts.length} of {gifts.length} gifts</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleGifts.map((gift) => {
            const state = stockState(gift.stockQuantity || 0);
            const badge = stockBadge[state];
            return (
            <div
              key={gift.id}
              className="group flex flex-col rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:border-purple-100 transition"
            >
              <div className="relative h-36 bg-linear-to-br from-purple-100 to-pink-100 overflow-hidden">
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    loading="lazy"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${state === "out" ? "grayscale opacity-80" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-purple-300" />
                  </div>
                )}
                <span className={`absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${badge.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>

              <div className="flex flex-col flex-1 p-3.5">
                <div className="min-h-[3.5rem]">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1" title={gift.name}>
                    {gift.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {gift.description || "No description"}
                  </p>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-none bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{naira(gift.price || 0)}</p>
                    {gift.flashSalePrice && <p className="text-[11px] font-semibold text-red-600 mt-1">Sale: {naira(gift.flashSalePrice)}</p>}
                    <p className="mt-1.5 text-[11px] text-gray-500">{gift.stockQuantity} in stock · {gift.priority}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 text-right shrink-0">{new Date(gift.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="mt-auto flex gap-2 pt-3">
                  <button
                    onClick={() => setEditingGiftId(gift.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-purple-200 text-purple-600 rounded-xl text-xs font-semibold hover:bg-purple-50 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(gift)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        </>
      )}

      {showAddModal && (
        <AddGiftModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchGifts}
        />
      )}

      {editingGiftId && (
        <AddGiftModal
          giftId={editingGiftId}
          onClose={() => setEditingGiftId(null)}
          onSuccess={() => {
            fetchGifts();
            setEditingGiftId(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Gift"
        message="Are you sure you want to delete this gift? This action cannot be undone."
        itemName={deleteModal.giftName}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, giftId: null, giftName: "" })
        }
      />
    </div>
  );
}
