"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2, Upload, ImageIcon } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import SizeVariantEditor from "@/components/product/SizeVariantEditor";
import {
  convertVariantKind,
  getVariantKind,
  readSizeVariants,
  totalVariantStock,
  type SizeVariant,
  type VariantKind,
} from "@/lib/sizeVariants";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId?: string | null;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
}: AddProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "0",
    imageUrl: "",
    categoryId: "",
    priority: "normal",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const [variantKind, setVariantKind] = useState<VariantKind>("size");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/categories?type=product");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }

        if (productId) {
          const productResponse = await fetch(`/api/products/${productId}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const product = productData.product;
            setFormData({
              name: product.name || "",
              description: product.description || "",
              price: product.price || "",
              stockQuantity: String(product.stockQuantity ?? 0),
              imageUrl: product.imageUrl || "",
              categoryId: product.categoryId || "",
              priority: product.priority || "normal",
            });
            const productSizeVariants = readSizeVariants(product.sizeVariants);
            setSizeVariants(productSizeVariants);
            setVariantKind(
              productSizeVariants.length > 0
                ? getVariantKind(productSizeVariants)
                : /\b(perfume|fragrance|cologne|eau de)\b/i.test(product.name)
                ? "volume"
                : "size"
            );
            if (productSizeVariants.length > 0) {
              setFormData((prev) => ({
                ...prev,
                stockQuantity: String(totalVariantStock(productSizeVariants)),
              }));
            }
            // Show existing images from imageUrls array
            if (product.imageUrls && product.imageUrls.length > 0) {
              setImagePreviews(product.imageUrls);
            } else if (product.imageUrl) {
              setImagePreviews([product.imageUrl]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (sizeVariants.length === 0) {
      if (
        name === "name" &&
        /\b(perfume|fragrance|cologne|eau de)\b/i.test(value)
      ) {
        setVariantKind("volume");
      } else if (name === "name") {
        setVariantKind("size");
      } else if (name === "categoryId") {
        const categoryName = categories.find(
          (category) => category.id === value
        )?.name;
        if (categoryName) {
          setVariantKind(
            /\b(perfume|fragrance|cologne)\b/i.test(categoryName)
              ? "volume"
              : "size"
          );
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = Math.max(0, 10 - imagePreviews.length);
    const newFiles = selectedFiles.slice(0, remainingSlots);

    try {
      const previews = await Promise.all(
        newFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                typeof reader.result === "string"
                  ? resolve(reader.result)
                  : reject(new Error("Unable to preview selected image"));
              reader.onerror = () =>
                reject(
                  reader.error || new Error("Unable to read selected image")
                );
              reader.readAsDataURL(file);
            })
        )
      );
      setImages((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...previews]);
    } catch (previewError) {
      const message =
        previewError instanceof Error
          ? previewError.message
          : "Unable to preview selected images";
      setError(message);
      showToast(message, "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const existingImageCount = imagePreviews.length - images.length;
    if (index >= existingImageCount) {
      const newImageIndex = index - existingImageCount;
      setImages((prev) => prev.filter((_, i) => i !== newImageIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload new images first
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        if (image instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", image);
          uploadFormData.append("folder", "products");

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          const uploadData: { error?: string; url?: string } =
            await uploadResponse.json();
          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || "Failed to upload image");
          }
          if (typeof uploadData.url !== "string" || !uploadData.url) {
            throw new Error("Image upload did not return a URL");
          }
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
        stockQuantity: Number(formData.stockQuantity),
        sizeVariants,
        imageUrl: allImageUrls[0] || "",
        imageUrls: allImageUrls,
        categoryId: formData.categoryId,
        priority: formData.priority,
      };

      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PUT" : "POST";

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
          data.error || `Failed to ${productId ? "update" : "create"} product`
        );
      }

      setFormData({
        name: "",
        description: "",
        price: "",
        stockQuantity: "0",
        imageUrl: "",
        categoryId: "",
        priority: "normal",
      });
      setImages([]);
      setImagePreviews([]);
      setSizeVariants([]);
      setVariantKind("size");

      showToast(
        productId
          ? `Product "${formData.name}" updated successfully!`
          : `Product "${formData.name}" added successfully!`,
        "success"
      );

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {productId ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
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
              placeholder="Enter product description"
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
            <SizeVariantEditor
              variants={sizeVariants}
              variantKind={variantKind}
              onVariantKindChange={(kind) => {
                setVariantKind(kind);
                const convertedVariants = convertVariantKind(
                  sizeVariants,
                  kind
                );
                setSizeVariants(convertedVariants);
                setFormData((prev) => ({
                  ...prev,
                  stockQuantity: String(totalVariantStock(convertedVariants)),
                }));
              }}
              onChange={(variants) => {
                setSizeVariants(variants);
                setFormData((prev) => ({
                  ...prev,
                  stockQuantity:
                    variants.length > 0
                      ? String(totalVariantStock(variants))
                      : prev.stockQuantity,
                }));
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              {sizeVariants.length > 0
                ? "Total stock across options"
                : "Number of products in stock *"}
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              min="0"
              step="1"
              required={sizeVariants.length === 0}
              readOnly={sizeVariants.length > 0}
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
              Product Images (up to 10) *
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
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
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

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="bestseller">Best Seller</option>
              <option value="trending">Trending</option>
              <option value="new">New</option>
              <option value="featured">Featured</option>
              <option value="sale">Sale</option>
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
                ? productId
                  ? "Updating..."
                  : "Creating..."
                : productId
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
