"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CatalogItemType = "product" | "gift" | "souvenir";

type CartItem = {
  id: number | string;
  itemType: CatalogItemType;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: CartItem["id"], itemType: CatalogItemType) => void;
  updateQuantity: (
    id: CartItem["id"],
    quantity: number,
    itemType: CatalogItemType
  ) => void;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setItems((current) => {
      const existing = current.find(
        (i) => i.id === product.id && i.itemType === product.itemType
      );
      if (existing) {
        return current.map((i) =>
          i.id === product.id && i.itemType === product.itemType
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: CartItem["id"], itemType: CatalogItemType) => {
    setItems((current) =>
      current.filter((i) => i.id !== id || i.itemType !== itemType)
    );
  };

  const updateQuantity = (
    id: CartItem["id"],
    quantity: number,
    itemType: CatalogItemType
  ) => {
    if (quantity <= 0) {
      removeFromCart(id, itemType);
      return;
    }
    setItems((current) =>
      current.map((i) =>
        i.id === id && i.itemType === itemType
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
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
