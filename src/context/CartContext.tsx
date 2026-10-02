"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type CartItem = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stockQuantity?: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeFromCart: (id: CartItem["id"]) => void;
  updateQuantity: (id: CartItem["id"], quantity: number) => void;
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
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
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
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      const stockLimit = product.stockQuantity ?? existing.stockQuantity;
      if (stockLimit !== undefined && nextQuantity > stockLimit) return false;
      setItems((current) =>
        current.map((i) =>
          i.id === product.id ? { ...i, ...product, quantity: nextQuantity } : i
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

  const removeFromCart = (id: CartItem["id"]) => {
    setItems((current) => current.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: CartItem["id"], quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((current) =>
      current.map((i) =>
        i.id === id
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
          productIds: items.map((item) => String(item.id)),
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify cart inventory");
      }
      const availableById = new Map<
        string,
        { stockQuantity: number; price: number }
      >(
        data.products.map(
          (product: { id: string; stockQuantity: number; price: number }) => [
            product.id,
            product,
          ]
        )
      );
      const unavailableNames: string[] = [];
      const reconciledItems = items.flatMap((item) => {
        const available = availableById.get(String(item.id));
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
