"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Edit, Image as ImageIcon } from "lucide-react";
import Loader from "@/components/ui/Loader";
import AddGroceryModal from "./AddGroceryModal/AddGroceryModal";
import DeleteModal from "@/components/ui/DeleteModal";
import { showToast } from "@/components/ui/Toast";

interface Grocery {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  createdAt: string;
}

export default function ManageGroceries() {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroceryId, setEditingGroceryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    groceryId: string | null;
    groceryName: string;
  }>({
    isOpen: false,
    groceryId: null,
    groceryName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroceries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/groceries");
      if (!response.ok) throw new Error("Failed to fetch groceries");
      const data = await response.json();
      setGroceries(data.groceries || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groceries");
      setGroceries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroceries();
  }, []);

  const openDeleteModal = (grocery: Grocery) => {
    setDeleteModal({
      isOpen: true,
      groceryId: grocery.id,
      groceryName: grocery.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.groceryId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/groceries/${deleteModal.groceryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete grocery");
      setGroceries(groceries.filter((g) => g.id !== deleteModal.groceryId));
      setDeleteModal({ isOpen: false, groceryId: null, groceryName: "" });
      showToast(
        `Grocery "${deleteModal.groceryName}" deleted successfully!`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Groceries
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Manage grocery items and inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Grocery
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader text="Loading groceries..." />
        </div>
      ) : groceries.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <ImageIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No groceries yet
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create your first grocery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groceries.map((grocery) => (
            <div
              key={grocery.id}
              className="rounded-3xl bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-linear-to-br from-purple-100 to-pink-100 overflow-hidden">
                {grocery.imageUrl ? (
                  <img
                    src={grocery.imageUrl}
                    alt={grocery.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-purple-300" />
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {grocery.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {grocery.description || "No description"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Price
                    </p>
                    <p className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₦{grocery.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Added
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(grocery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingGroceryId(grocery.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-purple-200 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(grocery)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-full font-semibold hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddGroceryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchGroceries}
        />
      )}

      {editingGroceryId && (
        <AddGroceryModal
          groceryId={editingGroceryId}
          onClose={() => setEditingGroceryId(null)}
          onSuccess={() => {
            fetchGroceries();
            setEditingGroceryId(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Grocery Item"
        message="Are you sure you want to delete this grocery item? This action cannot be undone."
        itemName={deleteModal.groceryName}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, groceryId: null, groceryName: "" })
        }
      />
    </div>
  );
}
