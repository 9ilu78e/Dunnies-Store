export type GiftIncludedProduct = {
  productId: string;
  quantity: number;
};

export type GiftContentSelection = GiftIncludedProduct & {
  size?: string;
};

export type GiftContentSnapshot = GiftContentSelection & {
  name: string;
  price: number;
  image: string;
};

export function giftContentsKey(contents?: GiftContentSelection[]): string {
  return JSON.stringify(
    (contents ?? [])
      .map((content) => ({
        productId: content.productId,
        size: content.size ?? "",
        quantity: content.quantity,
      }))
      .sort((a, b) =>
        `${a.productId}:${a.size}`.localeCompare(`${b.productId}:${b.size}`)
      )
  );
}

export type GiftContentsValidation =
  | { valid: true; contents: GiftIncludedProduct[] }
  | { valid: false; error: string };

export function validateGiftIncludedProducts(
  value: unknown
): GiftContentsValidation {
  if (!Array.isArray(value)) {
    return { valid: false, error: "Gift contents must be a list" };
  }

  const merged = new Map<string, number>();
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      !("productId" in item) ||
      !("quantity" in item) ||
      typeof item.productId !== "string" ||
      !item.productId.trim() ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return {
        valid: false,
        error: "Each gift item needs a product and a positive whole-number quantity",
      };
    }

    const productId = item.productId.trim();
    merged.set(productId, (merged.get(productId) ?? 0) + item.quantity);
  }

  return {
    valid: true,
    contents: [...merged].map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  };
}

export function readGiftIncludedProducts(
  value: unknown
): GiftIncludedProduct[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("productId" in item) ||
      !("quantity" in item) ||
      typeof item.productId !== "string" ||
      !item.productId.trim() ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return [];
    }
    return [{ productId: item.productId.trim(), quantity: item.quantity }];
  });
}
