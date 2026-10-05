"use client";

import type { ProductRecord } from "@/Data/products";

export default function ProductSpecifications({
  product,
  title = "Product details",
}: {
  product: ProductRecord;
  title?: string;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
        {title}
      </h2>
      {(product.longDescription || product.description) && (
        <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Description
          </h3>
          <p className="whitespace-pre-line break-words text-sm leading-7 text-gray-700">
            {product.longDescription || product.description}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {product.specs
          .filter((spec) => spec.label.toLowerCase() !== "sku")
          .map((spec) => (
            <div
              key={spec.label}
              className="flex min-w-0 flex-col gap-1 rounded-xl border border-gray-100 bg-white p-3 sm:p-4"
            >
              <span className="text-xs font-medium text-gray-500">
                {spec.label}
              </span>
              <span className="break-words text-sm font-semibold text-gray-900">
                {spec.value}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}
