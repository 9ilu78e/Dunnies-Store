import type { SizeVariant } from "@/lib/sizeVariants";
import type { GiftIncludedProduct } from "@/lib/giftContents";

export type ProductReview = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  stockQuantity?: number;
  sizeVariants?: SizeVariant[];
  includedProducts?: GiftIncludedProduct[];
  extraPrice?: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  tag: string;
  category: string;
  href: string;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  highlights: string[];
  specs: { label: string; value: string }[];
  reviews: ProductReview[];
};

export const productsCatalog: ProductRecord[] = [];

export const getProductById = (id: string): ProductRecord | null => {
  return null;
};
