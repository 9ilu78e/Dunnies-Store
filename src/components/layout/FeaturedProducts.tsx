"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductCard from "@/components/product/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  imageUrls: string[];
  averageRating: number;
  totalComments: number;
  flashSalePrice: number | null;
  flashSaleEndsAt: string | null;
}

function ProductsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden sm:gap-5" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="w-[44%] shrink-0 animate-pulse sm:w-[30%] lg:w-[23%]"
        >
          <div className="aspect-[4/3] rounded-xl bg-gray-100" />
          <div className="mt-3 h-4 w-4/5 rounded bg-gray-100" />
          <div className="mt-2 h-5 w-2/5 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?summary=true", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            `Products request failed with status ${response.status}`
          );
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }
        console.error("Failed to fetch homepage products:", fetchError);
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void fetchProducts();
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-white py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between sm:mb-10">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              All Products
            </h2>
            <p className="text-base text-gray-600 sm:text-lg">
              Shop our full collection
            </p>
          </div>
          <Link
            href="/product"
            className="hidden items-center space-x-2 font-semibold text-purple-600 hover:text-purple-700 group sm:flex"
          >
            <span>View All</span>
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <ProductsSkeleton />
        ) : error ? (
          <p role="alert" className="py-8 text-center text-sm text-gray-600">
            Products could not be loaded. Please refresh the page to try again.
          </p>
        ) : products.length === 0 ? (
          <p className="py-8 text-center text-gray-600">
            No products available yet.
          </p>
        ) : (
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-5"
            aria-label="All products. Scroll horizontally to see more."
          >
            {products.map((product, index) => {
              const isFlashSaleActive =
                product.flashSalePrice !== null &&
                product.flashSaleEndsAt !== null &&
                new Date(product.flashSaleEndsAt).getTime() > Date.now();
              const image =
                product.imageUrls?.[0] || product.imageUrl || undefined;

              return (
                <div
                  key={product.id}
                  className="h-full w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={
                      isFlashSaleActive
                        ? product.flashSalePrice ?? product.price
                        : product.price
                    }
                    originalPrice={
                      isFlashSaleActive ? product.price : undefined
                    }
                    stockQuantity={product.stockQuantity}
                    image={image}
                    rating={product.averageRating ?? 0}
                    reviews={product.totalComments ?? 0}
                    href={`/product/${product.id}`}
                    priority={index < 2}
                    className="rounded-xl"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
