export type SizeVariant = {
  size: string;
  stockQuantity: number;
};

export type SizeVariantsValidation =
  | { valid: true; variants: SizeVariant[] }
  | { valid: false; error: string };

export function validateSizeVariants(value: unknown): SizeVariantsValidation {
  if (!Array.isArray(value)) {
    return { valid: false, error: "Sizes must be a list" };
  }

  const variants: SizeVariant[] = [];
  const seenSizes = new Set<string>();
  let totalStock = 0;

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      !("size" in item) ||
      !("stockQuantity" in item)
    ) {
      return {
        valid: false,
        error: "Each size needs a label and stock quantity",
      };
    }

    const size =
      typeof item.size === "string" ? item.size.trim().toUpperCase() : "";
    const stockQuantity = item.stockQuantity;
    if (!size) {
      return { valid: false, error: "Size labels cannot be empty" };
    }
    if (seenSizes.has(size)) {
      return { valid: false, error: "Size labels must be unique" };
    }
    if (
      typeof stockQuantity !== "number" ||
      !Number.isSafeInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      return {
        valid: false,
        error: `Enter a non-negative whole-number stock count for size ${size}`,
      };
    }
    totalStock += stockQuantity;
    if (totalStock > 2_147_483_647) {
      return {
        valid: false,
        error: "Total stock across sizes is too large",
      };
    }

    seenSizes.add(size);
    variants.push({ size, stockQuantity });
  }

  return { valid: true, variants };
}

export function readSizeVariants(value: unknown): SizeVariant[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("size" in item) ||
      !("stockQuantity" in item) ||
      typeof item.size !== "string" ||
      typeof item.stockQuantity !== "number" ||
      !Number.isSafeInteger(item.stockQuantity) ||
      item.stockQuantity < 0
    ) {
      return [];
    }

    const size = item.size.trim().toUpperCase();
    return size ? [{ size, stockQuantity: item.stockQuantity }] : [];
  });
}

export function totalVariantStock(variants: SizeVariant[]): number {
  return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
}
