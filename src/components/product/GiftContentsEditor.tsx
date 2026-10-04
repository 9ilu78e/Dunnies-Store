"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GiftIncludedProduct } from "@/lib/giftContents";

type AvailableProduct = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
};

type GiftContentsEditorProps = {
  contents: GiftIncludedProduct[];
  onChange: (contents: GiftIncludedProduct[]) => void;
  onBasePriceChange: (price: number) => void;
};

export default function GiftContentsEditor({
  contents,
  onChange,
  onBasePriceChange,
}: GiftContentsEditorProps) {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load store products");
        }
        if (!cancelled) {
          setProducts(
            (data.products || [])
              .filter(
                (product: AvailableProduct) => typeof product.name === "string"
              )
              .map((product: AvailableProduct) => ({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                stockQuantity: product.stockQuantity,
              }))
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load store products"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const includedPrice = contents.reduce((total, content) => {
    const product = products.find((item) => item.id === content.productId);
    return total + (product?.price ?? 0) * content.quantity;
  }, 0);

  useEffect(() => {
    if (!loading && !error) onBasePriceChange(includedPrice);
  }, [error, includedPrice, loading, onBasePriceChange]);

  const addProduct = () => {
    const alreadyAdded = new Set(contents.map((item) => item.productId));
    const product = products.find(
      (item) => item.stockQuantity > 0 && !alreadyAdded.has(item.id)
    );
    if (product) {
      onChange([...contents, { productId: product.id, quantity: 1 }]);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Products included in this gift
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Choose the default contents shoppers see first. They can customise the
          products and quantities before adding the gift to their cart; the
          final price is based on their selection.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading available products...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">
          Add in-stock products before configuring gift contents.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-800">
            Included items: ₦{includedPrice.toLocaleString()}
          </p>
          {contents.map((item, index) => {
            const selectedProduct = products.find(
              (product) => product.id === item.productId
            );
            return (
              <div
                key={`${item.productId}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_5rem_auto] gap-2"
              >
                <select
                  value={item.productId}
                  onChange={(event) =>
                    onChange(
                      contents.map((content, contentIndex) =>
                        contentIndex === index
                          ? { ...content, productId: event.target.value }
                          : content
                      )
                    )
                  }
                  aria-label={`Gift product ${index + 1}`}
                  className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  {selectedProduct &&
                    !products.some(
                      (product) => product.id === item.productId
                    ) && (
                      <option value={item.productId}>
                        {selectedProduct.name} (currently unavailable)
                      </option>
                    )}
                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                      disabled={
                        product.stockQuantity <= 0 &&
                        product.id !== item.productId
                      }
                    >
                      {product.name}
                      {product.stockQuantity <= 0 ? " (out of stock)" : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) =>
                    onChange(
                      contents.map((content, contentIndex) =>
                        contentIndex === index
                          ? {
                              ...content,
                              quantity: Math.max(
                                1,
                                Number(event.target.value) || 1
                              ),
                            }
                          : content
                      )
                    )
                  }
                  aria-label={`Quantity of gift product ${index + 1}`}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      contents.filter(
                        (_, contentIndex) => contentIndex !== index
                      )
                    )
                  }
                  aria-label={`Remove ${
                    selectedProduct?.name || "product"
                  } from gift`}
                  className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addProduct}
            disabled={
              !products.some(
                (product) =>
                  product.stockQuantity > 0 &&
                  !contents.some((item) => item.productId === product.id)
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add included product
          </button>
        </>
      )}
    </section>
  );
}
