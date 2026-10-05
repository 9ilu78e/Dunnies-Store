"use client";

import type { ProductRecord } from "@/Data/products";
import ProductDetail from "../product/ProductDetail";
import ProductSpecifications from "../shared/ProductSpecifications";

function GiftDetails({ product }: { product: ProductRecord }) {
  const includedItemCount = (product.includedProducts ?? []).reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="space-y-4">
      <ProductSpecifications product={product} title="About this gift" />
      <section className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900">
          A gift made your way
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-700">
          Choose the products, quantities, and available options for your
          bundle. The price updates to match your selection.
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
          <div>
            <dt className="font-medium">Starting selection</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {includedItemCount}{" "}
              {includedItemCount === 1 ? "item" : "items"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Packing &amp; box</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              ₦{(product.extraPrice ?? 0).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function GiftDetail({ product }: { product: ProductRecord }) {
  return (
    <ProductDetail
      product={product}
      itemType="gift"
      detailsContent={<GiftDetails product={product} />}
    />
  );
}
