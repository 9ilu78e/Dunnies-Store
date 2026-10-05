"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { giftContentsKey, type GiftContentSnapshot } from "@/lib/giftContents";

export type CatalogItemType = "product" | "gift" | "souvenir";

type CartItem = {
  id: number | string;
  itemType: CatalogItemType;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stockQuantity?: number;
  deliveryFee?: number;
  size?: string;
  giftContents?: GiftContentSnapshot[];
};

function getCartItemKey(item: CartItem): string {
  return `${item.itemType}:${item.id}:${item.size ?? ""}:${giftContentsKey(
    item.giftContents
  )}`;
}

function mergeDuplicateCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const key = getCartItemKey(item);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        ...item,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      merged.set(key, item);
    }
  }
  return Array.from(merged.values());
}

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeFromCart: (
    id: CartItem["id"],
    itemType: CatalogItemType,
    size?: string,
    giftContents?: GiftContentSnapshot[]
  ) => void;
  updateQuantity: (
    id: CartItem["id"],
    quantity: number,
    itemType: CatalogItemType,
    size?: string,
    giftContents?: GiftContentSnapshot[]
  ) => void;
  refreshInventory: () => Promise<string[]>;
  inventoryChecking: boolean;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [inventoryChecking, setInventoryChecking] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dunnis-cart");
      if (stored) {
        const parsed = JSON.parse(stored) as Array<
          Omit<CartItem, "itemType"> & { itemType?: CatalogItemType }
        >;
        if (Array.isArray(parsed)) {
          const restoredItems = parsed.map((item) => ({
            ...item,
            itemType: item.itemType ?? "product",
          })) as CartItem[];
          setItems(mergeDuplicateCartItems(restoredItems));
        }
      }
    } catch (error) {
      console.error("Unable to restore saved cart:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem("dunnis-cart", JSON.stringify(items));
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [cartLoaded, items]);

  const addToCart = (product: Omit<CartItem, "quantity">, quantity = 1) => {
    if (product.stockQuantity !== undefined && product.stockQuantity < 1) {
      return false;
    }
    const existing = items.find(
      (item) =>
        item.id === product.id &&
        item.itemType === product.itemType &&
        item.size === product.size &&
        giftContentsKey(item.giftContents) ===
          giftContentsKey(product.giftContents)
    );
    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      const stockLimit = product.stockQuantity ?? existing.stockQuantity;
      if (stockLimit !== undefined && nextQuantity > stockLimit) return false;
      setItems((current) =>
        current.map((i) =>
          i.id === product.id &&
          i.itemType === product.itemType &&
          i.size === product.size &&
          giftContentsKey(i.giftContents) ===
            giftContentsKey(product.giftContents)
            ? { ...i, ...product, quantity: nextQuantity }
            : i
        )
      );
      return true;
    }
    if (
      product.stockQuantity !== undefined &&
      quantity > product.stockQuantity
    ) {
      return false;
    }
    setItems((current) => [...current, { ...product, quantity }]);
    return true;
  };

  const removeFromCart = (
    id: CartItem["id"],
    itemType: CatalogItemType,
    size?: string,
    giftContents?: GiftContentSnapshot[]
  ) => {
    setItems((current) =>
      current.filter(
        (i) =>
          i.id !== id ||
          i.itemType !== itemType ||
          i.size !== size ||
          giftContentsKey(i.giftContents) !== giftContentsKey(giftContents)
      )
    );
  };

  const updateQuantity = (
    id: CartItem["id"],
    quantity: number,
    itemType: CatalogItemType,
    size?: string,
    giftContents?: GiftContentSnapshot[]
  ) => {
    if (quantity <= 0) {
      removeFromCart(id, itemType, size, giftContents);
      return;
    }
    setItems((current) =>
      current.map((i) =>
        i.id === id &&
        i.itemType === itemType &&
        i.size === size &&
        giftContentsKey(i.giftContents) === giftContentsKey(giftContents)
          ? {
              ...i,
              quantity:
                i.stockQuantity === undefined
                  ? quantity
                  : Math.min(quantity, i.stockQuantity),
            }
          : i
      )
    );
  };

  const refreshInventory = useCallback(async () => {
    if (items.length === 0) return [];
    setInventoryChecking(true);
    try {
      const response = await fetch("/api/cart/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: String(item.id),
            itemType: item.itemType,
            ...(item.size ? { size: item.size } : {}),
            ...(item.giftContents
              ? { giftContents: item.giftContents }
              : {}),
          })),
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify cart inventory");
      }
      const availableByItem = new Map<
        string,
        {
          stockQuantity: number;
          price: number;
          deliveryFee: number;
          itemType: CatalogItemType;
          size?: string;
          giftContents?: GiftContentSnapshot[];
        }
      >(
        data.items.map(
          (item: {
            id: string;
            itemType: CatalogItemType;
            stockQuantity: number;
            price: number;
            deliveryFee: number;
            size?: string;
            giftContents?: GiftContentSnapshot[];
          }) => [
            `${item.itemType}:${item.id}:${item.size ?? ""}:${giftContentsKey(item.giftContents)}`,
            item,
          ]
        )
      );
      const unavailableNames: string[] = [];
      const reconciledItems = items.flatMap((item) => {
        const available = availableByItem.get(
          `${item.itemType}:${item.id}:${item.size ?? ""}:${giftContentsKey(item.giftContents)}`
        );
        if (!available || available.stockQuantity < 1) {
          unavailableNames.push(item.name);
          return [];
        }
        return [
          {
            ...item,
            quantity: Math.min(item.quantity, available.stockQuantity),
            stockQuantity: available.stockQuantity,
            price: available.price,
            deliveryFee: available.deliveryFee,
            ...(available.giftContents
              ? { giftContents: available.giftContents }
              : {}),
          },
        ];
      });
      setItems(reconciledItems);
      return unavailableNames;
    } finally {
      setInventoryChecking(false);
    }
  }, [items]);

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshInventory,
        inventoryChecking,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
