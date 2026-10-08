"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ProductRecord } from "@/Data/products";
import { useCart, type CatalogItemType } from "@/context/CartContext";
import { showToast } from "@/components/ui/Toast";
import type {
  GiftContentSelection,
  GiftContentSnapshot,
} from "@/lib/giftContents";
import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
  getVariantKind,
  type SizeVariant,
} from "@/lib/sizeVariants";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/layout/SiteSettingsProvider";
import type { GiftProductDetail } from "../gift/GiftDetailsPanel";

type ProductPurchaseActionsProps = {
  product: ProductRecord;
  itemType: CatalogItemType;
  sizeVariants: SizeVariant[];
  selectedSize: string;
  variantName: string;
  quantity: number;
  selectedImage: string;
  isCustomizableGift: boolean;
  giftContentsValid: boolean;
  selectedGiftContents: GiftContentSelection[];
  selectedGiftProductDetails: GiftProductDetail[];
  isAuthenticated: boolean;
  customerName?: string;
  setAvailableStock: Dispatch<SetStateAction<number | undefined>>;
};

export function useProductPurchaseActions({
  product,
  itemType,
  sizeVariants,
  selectedSize,
  variantName,
  quantity,
  selectedImage,
  isCustomizableGift,
  giftContentsValid,
  selectedGiftContents,
  selectedGiftProductDetails,
  isAuthenticated,
  customerName,
  setAvailableStock,
}: ProductPurchaseActionsProps) {
  const { addToCart } = useCart();
  const { supportPhone } = useSiteSettings();

  const fetchCurrentAvailability = async (
    size = selectedSize,
    giftContents: GiftContentSelection[] = isCustomizableGift
      ? selectedGiftContents
      : []
  ) => {
    const response = await fetch("/api/cart/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            id: product.id,
            itemType,
            ...(size ? { size } : {}),
            ...(isCustomizableGift ? { giftContents } : {}),
          },
        ],
      }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to check product stock");
    }
    const current = data.items.find(
      (item: {
        id: string;
        itemType: CatalogItemType;
        stockQuantity: number;
        price: number;
        deliveryFee: number;
        size?: string;
        giftContents?: GiftContentSnapshot[];
      }) =>
        item.id === product.id &&
        item.itemType === itemType &&
        item.size === (size || undefined)
    ) as
      | {
          id: string;
          itemType: CatalogItemType;
          stockQuantity: number;
          price: number;
          deliveryFee: number;
          size?: string;
          giftContents?: GiftContentSnapshot[];
        }
      | undefined;
    return current;
  };

  const handleAddToCart = async () => {
    try {
      if (sizeVariants.length > 0 && !selectedSize) {
        showToast(
          `Choose a ${variantName} before adding this item to your cart.`,
          "warning"
        );
        return;
      }
      if (isCustomizableGift && !giftContentsValid) {
        showToast(
          "Choose an available product, quantity, and any required option for every gift item.",
          "warning"
        );
        return;
      }
      const current = await fetchCurrentAvailability();
      if (!current || current.stockQuantity < 1) {
        setAvailableStock(0);
        showToast("This product is out of stock.", "warning");
        return;
      }
      setAvailableStock(current.stockQuantity);
      const added = addToCart(
        {
          id: product.id,
          itemType,
          name: product.name,
          price: current.price,
          deliveryFee: current.deliveryFee,
          image: selectedImage,
          stockQuantity: current.stockQuantity,
          ...(selectedSize ? { size: selectedSize } : {}),
          ...(current.giftContents?.length
            ? { giftContents: current.giftContents }
            : {}),
        },
        quantity
      );
      if (!added) {
        showToast(
          "Your cart quantity cannot exceed the available stock.",
          "warning"
        );
        return;
      }
      showToast("Product added to your cart.", "success");
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      showToast("Could not verify stock. Please try again.", "error");
    }
  };

  const handleOrderWhatsApp = async () => {
    if (sizeVariants.length > 0 && !selectedSize) {
      showToast(
        `Choose a ${variantName} before placing your order.`,
        "warning"
      );
      return;
    }
    if (isCustomizableGift && !giftContentsValid) {
      showToast(
        "Choose an available product, quantity, and any required option for every gift item.",
        "warning"
      );
      return;
    }
    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      showToast("Allow pop-ups to continue to WhatsApp.", "warning");
      return;
    }
    try {
      const current = await fetchCurrentAvailability();
      if (!current || current.stockQuantity < quantity) {
        setAvailableStock(current?.stockQuantity ?? 0);
        whatsappWindow.close();
        showToast(
          "This product is no longer available in the requested quantity.",
          "warning"
        );
        return;
      }
      setAvailableStock(current.stockQuantity);
      const whatsappNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || supportPhone;
      const productLink =
        typeof window !== "undefined"
          ? `${window.location.origin}${product.href}`
          : product.href;
      const variantKind = getVariantKind(sizeVariants);

      const whatsappLink = getWhatsAppLink(whatsappNumber, {
        productName: selectedSize
          ? `${product.name} (${getVariantKindLabel(
              variantKind
            )} ${formatVariantChoice(selectedSize)})`
          : product.name,
        ...(isCustomizableGift
          ? {
              productName: `${
                product.name
              }\nGift contents:\n${selectedGiftProductDetails
                .map(
                  (content) =>
                    `- ${content.product?.name || "Product"}${
                      content.size
                        ? ` (${getVariantKindLabel(
                            getVariantChoiceKind(content.size)
                          )} ${formatVariantChoice(content.size)})`
                        : ""
                    } × ${content.quantity}`
                )
                .join("\n")}`,
            }
          : {}),
        productPrice: current.price,
        productQuantity: quantity,
        productImage: selectedImage,
        productLink,
        ...(isAuthenticated && customerName ? { customerName } : {}),
        whatsappNumber,
      });

      whatsappWindow.location.href = whatsappLink;
    } catch (error) {
      console.error("Unable to verify WhatsApp order stock:", error);
      whatsappWindow.close();
      showToast("Could not verify stock. Please try again.", "error");
    }
  };

  return { handleAddToCart, handleOrderWhatsApp };
}
