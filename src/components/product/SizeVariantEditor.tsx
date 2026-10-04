"use client";

import { useState } from "react";
import { Plus, Ruler, X } from "lucide-react";
import {
  formatVariantChoice,
  type SizeVariant,
  type VariantKind,
} from "@/lib/sizeVariants";

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const PERFUME_VOLUMES = [
  "10 ML",
  "30 ML",
  "50 ML",
  "100 ML",
  "150 ML",
  "200 ML",
];
const COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Pink",
  "Brown",
  "Navy",
];
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
  variantKind: VariantKind;
  onVariantKindChange: (kind: VariantKind) => void;
};

export default function SizeVariantEditor({
  variants,
  onChange,
  variantKind,
  onVariantKindChange,
}: SizeVariantEditorProps) {
  const [customSize, setCustomSize] = useState("");
  const existingSizes = new Set(
    variants.map((variant) => variant.size.toUpperCase())
  );
  const customValue = customSize.trim().toUpperCase();
  const customOption =
    variantKind === "volume" && customValue && !/\s*ML$/i.test(customValue)
      ? `${customValue} ML`
      : variantKind === "color"
      ? `COLOR: ${customValue}`
      : customValue;

  const addPreset = (sizes: string[]) => {
    const additions = sizes
      .map((size) =>
        variantKind === "color" ? `COLOR: ${size.toUpperCase()}` : size
      )
      .filter((size) => !existingSizes.has(size.toUpperCase()))
      .map((size) => ({ size, stockQuantity: 0, kind: variantKind }));
    if (additions.length) onChange([...variants, ...additions]);
  };

  const addCustomSize = () => {
    if (
      variantKind === "volume" &&
      !/^\d+(?:\.\d+)?\s*(?:ML)?$/i.test(customValue)
    ) {
      return;
    }
    const size = customOption;
    if (!size || existingSizes.has(size)) return;
    onChange([...variants, { size, stockQuantity: 0, kind: variantKind }]);
    setCustomSize("");
  };

  return (
    <section className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Product options and stock
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Choose the options shoppers must select, then set the stock for each
          one. Each choice is shown on the product page and in order details.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onVariantKindChange("size")}
          aria-pressed={variantKind === "size"}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
            variantKind === "size"
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
          }`}
        >
          Size
        </button>
        <button
          type="button"
          onClick={() => onVariantKindChange("volume")}
          aria-pressed={variantKind === "volume"}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
            variantKind === "volume"
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
          }`}
        >
          <Ruler className="h-3.5 w-3.5" />
          Volume (ml)
        </button>
        <button
          type="button"
          onClick={() => onVariantKindChange("color")}
          aria-pressed={variantKind === "color"}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
            variantKind === "color"
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
          }`}
        >
          Color
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {variantKind === "volume" ? (
          PERFUME_VOLUMES.map((volume) => (
            <button
              key={volume}
              type="button"
              onClick={() => addPreset([volume])}
              className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
            >
              + {volume.toLowerCase()}
            </button>
          ))
        ) : variantKind === "color" ? (
          COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => addPreset([color])}
              className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
            >
              + {color}
            </button>
          ))
        ) : (
          <>
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
          </>
        )}
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
          placeholder={
            variantKind === "volume"
              ? "Custom volume, e.g. 75 ml"
              : variantKind === "color"
              ? "Custom color, e.g. burgundy"
              : "Custom size, e.g. UK 7 or 32"
          }
          aria-label={
            variantKind === "volume"
              ? "Custom volume in millilitres"
              : variantKind === "color"
              ? "Custom clothing color"
              : "Custom size"
          }
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustomSize}
          disabled={
            !customSize.trim() ||
            (variantKind === "volume" &&
              !/^\d+(?:\.\d+)?\s*(?:ML)?$/i.test(customSize.trim())) ||
            existingSizes.has(customOption.toUpperCase())
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
                {formatVariantChoice(variant.size)}
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
                aria-label={`Remove ${variant.size} option`}
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
