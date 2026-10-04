"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { SizeVariant } from "@/lib/sizeVariants";

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const UK_NUMERIC_SIZES = [
  "UK 6",
  "UK 8",
  "UK 10",
  "UK 12",
  "UK 14",
  "UK 16",
  "UK 18",
  "UK 20",
  "UK 22",
  "UK 24",
];

type SizeVariantEditorProps = {
  variants: SizeVariant[];
  onChange: (variants: SizeVariant[]) => void;
};

export default function SizeVariantEditor({
  variants,
  onChange,
}: SizeVariantEditorProps) {
  const [customSize, setCustomSize] = useState("");
  const existingSizes = new Set(
    variants.map((variant) => variant.size.toUpperCase())
  );

  const addPreset = (sizes: string[]) => {
    const additions = sizes
      .filter((size) => !existingSizes.has(size.toUpperCase()))
      .map((size) => ({ size, stockQuantity: 0 }));
    if (additions.length) onChange([...variants, ...additions]);
  };

  const addCustomSize = () => {
    const size = customSize.trim().toUpperCase();
    if (!size || existingSizes.has(size)) return;
    onChange([...variants, { size, stockQuantity: 0 }]);
    setCustomSize("");
  };

  return (
    <section className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Optional size choices
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Add standard UK numeric or letter sizes, or create custom sizes. Set
          stock for each size; shoppers must choose a size before adding it to
          their cart.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addPreset(UK_NUMERIC_SIZES)}
          className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
        >
          Add UK sizes (6-24)
        </button>
        <button
          type="button"
          onClick={() => addPreset(LETTER_SIZES)}
          className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
        >
          Add letter sizes (XS–XXXL)
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={customSize}
          onChange={(event) => setCustomSize(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomSize();
            }
          }}
          placeholder="Custom size, e.g. UK 7 or 32"
          aria-label="Custom size"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustomSize}
          disabled={
            !customSize.trim() ||
            existingSizes.has(customSize.trim().toUpperCase())
          }
          className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={`${variant.size}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"
            >
              <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                {variant.size}
              </span>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <span className="shrink-0">Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={variant.stockQuantity}
                  onChange={(event) => {
                    const stockQuantity =
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value);
                    onChange(
                      variants.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, stockQuantity } : item
                      )
                    );
                  }}
                  aria-label={`${variant.size} stock quantity`}
                  className="w-full min-w-0 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    variants.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
                aria-label={`Remove ${variant.size} size`}
                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
