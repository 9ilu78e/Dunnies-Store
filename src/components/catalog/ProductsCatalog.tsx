"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductList from "@/components/catalog/ProductList";
import Loader from "@/components/ui/Loader";
import { ProductRecord } from "@/Data/products";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  ChevronDown,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductsCatalogProps {
  products: ProductRecord[];
  initialSearchQuery?: string;
}

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export default function ProductsCatalog({
  products,
  initialSearchQuery = "",
}: ProductsCatalogProps) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = products;

      const searchTerms = normalizeSearchText(searchQuery)
        .split(/\s+/)
        .filter(Boolean);
      if (searchTerms.length > 0) {
        filtered = filtered.filter((product) => {
          const searchableText = normalizeSearchText(
            [
              product.name,
              product.description,
              product.longDescription,
              product.category,
              product.tag,
              product.price.toString(),
              product.originalPrice?.toString() || "",
            ].join(" ")
          );
          return searchTerms.every((term) => searchableText.includes(term));
        });
      }

      if (selectedCategory) {
        filtered = filtered.filter(
          (product) =>
            normalizeSearchText(product.category) ===
            normalizeSearchText(selectedCategory)
        );
      }

      setFilteredProducts(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, products]);

  if (categoriesLoading) {
    return <Loader text="Loading products..." />;
  }

  return (
    <>
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-purple-100 p-8 shadow-lg flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Catalog
          </p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Shop products
          </h1>
          <p className="text-slate-600 mt-2">
            Browse thoughtful gifts and memorable souvenirs for every occasion.
          </p>
        </div>
        <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, categories, keywords..."
              aria-label="Search products, gifts, and souvenirs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-purple-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setLayout("grid")}
              className={`inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 px-4 py-3 text-sm font-semibold transition ${
                layout === "grid"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-slate-700 hover:bg-purple-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 px-4 py-3 text-sm font-semibold transition ${
                layout === "list"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-slate-700 hover:bg-purple-50"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-50 text-purple-700 px-4 py-3 font-semibold hover:bg-purple-100 transition">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {}
      {categories.length > 0 && (
        <div className="mb-6 relative inline-block w-full sm:w-64">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-3 rounded-full font-medium transition bg-white border-2 border-purple-200 text-gray-700 hover:bg-purple-50 flex items-center justify-between"
          >
            <span>
              {selectedCategory ? `${selectedCategory}` : "All Products"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-200 rounded-2xl shadow-lg z-10">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left font-medium transition rounded-t-xl ${
                  selectedCategory === null
                    ? "bg-purple-600 text-white"
                    : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                All Products
              </button>
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left font-medium transition ${
                    selectedCategory === category.name
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-purple-50"
                  } ${index === categories.length - 1 ? "rounded-b-xl" : ""}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredProducts.length} product
        {filteredProducts.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="py-12">
          <Loader text="Loading products..." />
        </div>
      ) : filteredProducts.length > 0 ? (
        layout === "grid" ? (
          <ProductList
            products={filteredProducts.map((product) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              originalPrice: product.originalPrice,
              rating: product.rating,
              reviews: product.reviewsCount,
              image: product.image,
              stockQuantity: product.stockQuantity,
              tag: product.tag,
              href: product.href,
            }))}
            cols={3}
            gap={6}
          />
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={product.href || "#"}
                className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center hover:shadow-lg transition"
              >
                <div className="w-full md:w-48 h-48 bg-purple-50 rounded-2xl overflow-hidden">
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
                        {Number(
                          product.originalPrice - product.price
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="text-gray-600">{product.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₦{Number(product.originalPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      typeof product.stockQuantity !== "number"
                        ? "bg-gray-100 text-gray-600"
                        : product.stockQuantity > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {typeof product.stockQuantity !== "number"
                      ? "Stock unavailable"
                      : product.stockQuantity > 0
                      ? `${product.stockQuantity} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base">
            {searchQuery.trim()
              ? `No products found matching "${searchQuery.trim()}".`
              : "No products found in this category."}
          </p>
        </div>
      )}
    </>
  );
}
