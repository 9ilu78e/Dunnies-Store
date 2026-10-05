"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit2, Plus, Tag, Search } from "lucide-react";
import Loader from "@/components/ui/Loader";
import AddCategoryModal from "./AddCategoryModal/AddCategoryModal";
import DeleteModal from "@/components/ui/DeleteModal";

interface Category {
  id: string;
  name: string;
  description: string | null;
  type: string;
  imageUrl?: string;
  _count?: {
    products: number;
  };
  createdAt: string;
}

const TYPES = ["product", "gift", "souvenir"] as const;

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        <div className="h-3 w-1/3 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<
    "product" | "gift" | "souvenir"
  >("product");
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async (type: string = "product") => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories?type=${type}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(selectedType);
  }, [selectedType]);

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.categoryId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/categories/${deleteModal.categoryId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete category");
      setCategories(categories.filter((c) => c.id !== deleteModal.categoryId));
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const label = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Organize products, gifts, and souvenirs into categories
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Type tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setSearch("");
              }}
              aria-pressed={selectedType === type}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedType === type
                  ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label(type)}
            </button>
          ))}
        </div>

        {!loading && categories.length > 0 && (
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories"
              className="w-full rounded-full bg-white border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <>
          <div className="sr-only">
            <Loader text="Loading categories..." />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <Tag className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No categories yet
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create your first category
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl bg-white border border-gray-100 text-center p-10">
          <p className="text-gray-700 font-semibold">
            No categories match “{search}”
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 rounded-full border-2 border-purple-200 text-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-50 transition"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map((category) => {
            const count = category._count?.products ?? 0;
            return (
              <div
                key={category.id}
                className="group rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:border-purple-100 transition"
              >
                <div className="relative h-28 bg-linear-to-br from-purple-100 to-pink-100 overflow-hidden">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-9 h-9 text-purple-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 backdrop-blur">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="p-3.5">
                  <h2
                    className="text-sm font-bold text-gray-900 line-clamp-1"
                    title={category.name}
                  >
                    {category.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1 min-h-4">
                    {category.description || "No description"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold hover:bg-purple-100 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      aria-label={`Delete ${category.name}`}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => fetchCategories(selectedType)}
        editingCategory={editingCategory}
        selectedType={selectedType}
      />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        itemName={deleteModal.categoryName}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" })
        }
      />
    </div>
  );
}