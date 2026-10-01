"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2, Upload, ImageIcon } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface AddSouvenirModalProps {
  onClose: () => void;
  onSuccess: () => void;
  souvenirId?: string | null;
}

export default function AddSouvenirModal({
  onClose,
  onSuccess,
  souvenirId,
}: AddSouvenirModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    categoryId: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/categories?type=souvenir");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }

        if (souvenirId) {
          const souvenirResponse = await fetch(`/api/souvenirs/${souvenirId}`);
          if (souvenirResponse.ok) {
            const souvenirData = await souvenirResponse.json();
            const souvenir = souvenirData.souvenir;
            setFormData({
              name: souvenir.name || "",
              description: souvenir.description || "",
              price: souvenir.price || "",
              imageUrl: souvenir.imageUrl || "",
              categoryId: souvenir.categoryId || "",
            });
            if (souvenir.imageUrl) {
              setImagePreviews([souvenir.imageUrl]);
            }
            // Load existing imageUrls
            if (souvenir.imageUrls && souvenir.imageUrls.length > 0) {
              setImagePreviews((prev) => [
                ...new Set([...prev, ...souvenir.imageUrls]),
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (souvenirId || formData.name === "") {
      fetchData();
    }
  }, [souvenirId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 10;
    const newImages = [...images, ...files].slice(0, maxImages);
    setImages(newImages);

    const previews: string[] = [];
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === newImages.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new images first
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        if (image instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", image);
          uploadFormData.append("folder", "souvenirs");

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          const uploadData = await uploadResponse.json();
          uploadedImageUrls.push(uploadData.url);
        }
      }

      // Combine existing previews with new uploaded URLs
      const allImageUrls = [
        ...imagePreviews.filter((p) => !p.startsWith("data:")), // Keep existing URLs
        ...uploadedImageUrls, // Add new uploaded URLs
      ];

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || allImageUrls[0] || "",
        imageUrls: allImageUrls,
        categoryId: formData.categoryId,
      };

      const url = souvenirId ? `/api/souvenirs/${souvenirId}` : "/api/souvenirs";
      const method = souvenirId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Failed to ${souvenirId ? "update" : "create"} souvenir`
        );
      }

      setFormData({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: "",
      });
      setImages([]);
      setImagePreviews([]);

      showToast(
        souvenirId
          ? `Souvenir "${formData.name}" updated successfully!`
          : `Souvenir "${formData.name}" added successfully!`,
        "success"
      );

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {souvenirId ? "Edit Souvenir" : "Add Souvenir"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter item name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter item description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Price (₦) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Featured Image URL (optional)
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Souvenir Images (up to 10) *
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 rounded-lg py-6 hover:bg-purple-50 transition"
            >
              <Upload className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">
                Click to upload or drag and drop
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {images.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {images.length} image(s) selected
              </p>
            )}

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Category
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "Select a category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? souvenirId
                  ? "Updating..."
                  : "Creating..."
                : souvenirId
                ? "Update Souvenir"
                : "Add Souvenir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
