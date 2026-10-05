"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductRecord } from "@/Data/products";

type RelatedProduct = Pick<
  ProductRecord,
  "id" | "name" | "price" | "image" | "images" | "href" | "category"
>;

export default function RelatedProducts({
  product,
}: {
  product: ProductRecord;
}) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    if (!product.category) {
      setRelatedProducts([]);
      return;
    }
    let cancelled = false;
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const categoryName = product.category.trim().toLowerCase();
        if (cancelled) return;
        const matches = (data.products || [])
          .filter(
            (item: {
              id: string;
              category?: { name?: string } | string;
            }) => {
              const itemCategory =
                typeof item.category === "string"
                  ? item.category
                  : item.category?.name || "";
              return (
                item.id !== product.id &&
                itemCategory.trim().toLowerCase() === categoryName
              );
            }
          )
          .slice(0, 4)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            image: item.image || item.imageUrl || item.images?.[0] || "",
            images:
              Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : [item.imageUrl || item.image || ""].filter(Boolean),
            href: `/product/${item.id}`,
            category:
              typeof item.category === "string"
                ? item.category
                : item.category?.name || "Uncategorized",
          }));
        setRelatedProducts(matches);
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };
    void fetchRelatedProducts();
    return () => {
      cancelled = true;
    };
  }, [product.category, product.id]);

  if (!relatedProducts.length) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-purple-600">
            Discover more
          </p>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            You may also like
          </h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {relatedProducts.map((relatedProduct) => (
          <Link
            key={relatedProduct.id}
            href={relatedProduct.href}
            className="group rounded-2xl border border-gray-200 bg-gray-50 p-3 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-white">
              {relatedProduct.images?.[0] ? (
                <Image
                  src={relatedProduct.images[0]}
                  alt={relatedProduct.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                  No image
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                {relatedProduct.name}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-purple-600">
                  ₦{Number(relatedProduct.price).toLocaleString()}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  {relatedProduct.category}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
