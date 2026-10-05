export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  giftContents?: Array<{ name: string; quantity: number; size?: string }>;
};

export type OrderStatusEmailDetails = {
  orderNumber: string;
  status: string;
  items: OrderEmailItem[];
  total: number;
  deliveryFee: number | null;
  deliveryAddress: string;
  paymentMethod: string;
  orderDate: Date;
};

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function getSafeEmailImageUrl(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? escapeHtml(url.toString()) : "";
  } catch {
    return "";
  }
}
