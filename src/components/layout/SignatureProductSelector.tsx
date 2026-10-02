"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import ProductList from "@/components/product/ProductList";

type ExperienceProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stockQuantity: number;
  image: string;
  tag: string;
  href: string;
  categoryId: string;
  categoryName: string;
};

export default function SignatureProductSelector({
  products,
}: {
  products: ExperienceProduct[];
}) {
  const [categoryId, setCategoryId] = useState("all");
  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          products
            .filter((product) => product.categoryId)
            .map((product) => [product.categoryId, product.categoryName])
        ),
        ([id, name]) => ({ id, name })
      ),
    [products]
  );
  const filteredProducts =
    categoryId === "all"
      ? products
      : products.filter((product) => product.categoryId === categoryId);

  return (
    <div className="space-y-5">
      <label className="relative block max-w-sm">
        <span className="mb-2 block text-sm font-semibold text-gray-700">
          Browse by category
        </span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        >
          <option value="all">All signature picks</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-gray-500" />
      </label>
      {filteredProducts.length ? (
        <ProductList products={filteredProducts} cols={3} gap={8} />
      ) : (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600">
          No signature picks in this category yet.
        </p>
      )}
    </div>
  );
}
