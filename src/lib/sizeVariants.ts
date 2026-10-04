export type SizeVariant = {
  size: string;
  stockQuantity: number;
  kind?: VariantKind;
};

export type VariantKind = "size" | "volume" | "color" | "belt";

export function getVariantChoiceKind(size: string): VariantKind {
  if (/^COLOR:/i.test(size)) return "color";
  if (/^BELT:/i.test(size)) return "belt";
  if (/^\d+(?:\.\d+)?\s*ML$/i.test(size)) return "volume";
  return "size";
}

export function getVariantKindLabel(kind: VariantKind): string {
  switch (kind) {
    case "volume":
      return "Volume";
    case "color":
      return "Color";
    case "belt":
      return "Belt size";
    default:
      return "Size";
  }
}

export function getVariantKind(variants: SizeVariant[]): VariantKind {
  if (variants.length === 0) return "size";
  const kinds = variants.map((variant) => {
    return variant.kind ?? getVariantChoiceKind(variant.size);
  });
  return kinds.every((kind) => kind === kinds[0]) ? kinds[0] : "size";
}

export function formatVariantChoice(size: string): string {
  if (/^COLOR:/i.test(size)) {
    return size.replace(/^COLOR:\s*/i, "");
  }
  if (/^BELT:/i.test(size)) {
    return `${size.replace(/^BELT:\s*/i, "")} in`;
  }
  return /^\d+(?:\.\d+)?\s*ML$/i.test(size) ? size.toLowerCase() : size;
}

export function convertVariantKind(
  variants: SizeVariant[],
  kind: VariantKind
): SizeVariant[] {
  return variants.map((variant) => {
    const currentLabel = formatVariantChoice(variant.size);
    const label =
      kind === "volume"
        ? /^\d+(?:\.\d+)?(?:\s*ML)?$/i.test(currentLabel)
          ? `${currentLabel.replace(/\s*ML$/i, "").trim()} ML`
          : currentLabel
        : kind === "color"
        ? `COLOR: ${currentLabel.trim().toUpperCase()}`
        : kind === "belt"
        ? `BELT: ${currentLabel.replace(/\s*IN$/i, "").trim()}`
        : currentLabel.replace(/\s*(?:ML|IN)$/i, "").trim();
    return { ...variant, size: label, kind };
  });
}

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
    const kind =
      "kind" in item &&
      (item.kind === "size" ||
        item.kind === "volume" ||
        item.kind === "color" ||
        item.kind === "belt")
        ? item.kind
        : undefined;
    variants.push({ size, stockQuantity, ...(kind ? { kind } : {}) });
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
    const kind =
      "kind" in item &&
      (item.kind === "size" ||
        item.kind === "volume" ||
        item.kind === "color" ||
        item.kind === "belt")
        ? item.kind
        : undefined;
    return size
      ? [{ size, stockQuantity: item.stockQuantity, ...(kind ? { kind } : {}) }]
      : [];
  });
}

export function totalVariantStock(variants: SizeVariant[]): number {
  return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
}
