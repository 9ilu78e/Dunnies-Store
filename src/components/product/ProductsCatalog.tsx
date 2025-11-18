"use client";

import { useState } from "react";
import Link from "next/link";
import ProductList from "@/components/product/ProductList";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
} from "lucide-react";

type CatalogProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  tag: string;
  href: string;
};

interface ProductsCatalogProps {
  products: CatalogProduct[];
}

export default function ProductsCatalog({ products }: ProductsCatalogProps) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  return (
    <>
      <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Catalog
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            Shop products
          </h1>
          <p className="text-gray-600 mt-2">
            Browse curated collections of gifts, groceries, home goods, and more.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, categories, keywords..."
              className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setLayout("grid")}
              className={`inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold transition ${
                layout === "grid"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold transition ${
                layout === "list"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-100 text-gray-700 px-4 py-3 font-semibold hover:bg-gray-200 transition">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {layout === "grid" ? (
        <ProductList products={products} cols={3} gap={6} />
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href || "#"}
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center hover:shadow-lg transition"
            >
              <div className="w-full md:w-48 h-48 bg-gray-50 rounded-2xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {product.tag}
                  </p>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-500">
                      Save ₦
                      {Number(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {product.name}
                </h2>
                <p className="text-gray-600">{product.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₦{Number(product.price).toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ₦{Number(product.originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

