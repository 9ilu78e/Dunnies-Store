"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductList from "@/components/product/ProductList";
import Loader from "@/components/ui/Loader";
import { ProductRecord } from "@/Data/products";
import { Search, SlidersHorizontal, Grid, List } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductsCatalogProps {
  products: ProductRecord[];
}

export default function ProductsCatalog({ products }: ProductsCatalogProps) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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

      if (searchQuery) {
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCategory) {
        filtered = filtered.filter(
          (product) => product.category === selectedCategory
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
          <h1 className="text-4xl font-bold text-gray-900 mt-1">
            Shop products
          </h1>
          <p className="text-slate-600 mt-2">
            Browse curated collections of gifts, groceries, home goods, and
            more.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, categories, keywords..."
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

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedCategory === null
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedCategory === category.name
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
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
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No products found matching your search.
          </p>
        </div>
      )}
    </>
  );
}
