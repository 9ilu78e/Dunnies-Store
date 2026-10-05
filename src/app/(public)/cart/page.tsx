"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import { giftContentsKey } from "@/lib/giftContents";
import { useAuth } from "@/hooks/useAuth";
import { summarizeDeliveryFees } from "@/lib/deliveryFees";
import {
  formatVariantChoice,
  getVariantChoiceKind,
  getVariantKindLabel,
} from "@/lib/sizeVariants";

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Cart", "Delivery and payment", "Confirmation"];
  return (
    <ol
      className="flex w-full min-w-0 items-center gap-1.5 text-xs sm:w-auto sm:gap-2 sm:text-sm"
      aria-label="Checkout progress"
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={label}
            className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${
              n < steps.length ? "flex-1 sm:flex-none" : ""
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-linear-to-r from-violet-600 to-fuchsia-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </span>
            <span
              className={`min-w-0 truncate font-semibold ${
                active ? "text-gray-900" : "text-gray-500 hidden sm:inline"
              }`}
            >
              {label}
            </span>
            {n < steps.length && (
              <span className="h-px min-w-3 flex-1 bg-gray-300 sm:w-10 sm:flex-none" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [inventoryError, setInventoryError] = useState("");
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    totalItems,
    refreshInventory,
    inventoryChecking,
  } = useCart();

  useEffect(() => {
    if (cartItems.length === 0) return;
    void refreshInventory()
      .then((unavailable) => {
        if (unavailable.length > 0) {
          showToast(
            `${unavailable.join(", ")} ${
              unavailable.length === 1 ? "is" : "are"
            } out of stock and ${
              unavailable.length === 1 ? "has" : "have"
            } been removed from your cart.`,
            "warning"
          );
        }
        setInventoryError("");
      })
      .catch((error: unknown) => {
        console.error("Unable to refresh cart inventory:", error);
        setInventoryError(
          "We could not verify stock right now. Please try again before checkout."
        );
      });
  }, [totalItems]);

  const proceedToCheckout = async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      sessionStorage.setItem("dunnis:returnTo", "/checkout");
      router.push("/login");
      return;
    }

    setInventoryError("");
    try {
      const unavailable = await refreshInventory();
      if (unavailable.length > 0) {
        showToast(
          "Out-of-stock items were removed. Please review your cart.",
          "warning"
        );
        return;
      }
      router.push("/checkout");
    } catch (error) {
      console.error("Unable to verify cart before checkout:", error);
      setInventoryError(
        "We could not verify stock. Please try again before checkout."
      );
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const { total: deliveryFee, pending: deliveryFeePending } =
    summarizeDeliveryFees(cartItems);
  const total = subtotal + deliveryFee;
  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const checkoutBusy = inventoryChecking || authLoading;
  const checkoutLabel = authLoading
    ? "Checking account..."
    : inventoryChecking
    ? "Checking stock..."
    : "Proceed to checkout";

  if (totalItems === 0) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-linear-to-br from-violet-50 to-fuchsia-50 py-10 sm:py-16 flex items-center justify-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-10 md:p-12 text-center max-w-md w-full mx-3 sm:mx-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-5 sm:mb-6">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold hover:shadow-lg transition"
          >
            Continue shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-br from-violet-50 to-fuchsia-50 py-5 sm:py-8 pb-36 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
              Shopping cart
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Stepper current={1} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
          {/* Items */}
          <div className="min-w-0 lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item, index) => {
              const atMax =
                item.stockQuantity !== undefined &&
                item.quantity >= item.stockQuantity;
              const lowStock =
                item.stockQuantity !== undefined &&
                item.stockQuantity > 0 &&
                item.stockQuantity <= 5;

              return (
                <div
                  key={`${item.itemType}:${item.id}:${
                    item.size ?? ""
                  }:${giftContentsKey(item.giftContents)}:${index}`}
                  className="bg-white rounded-2xl sm:rounded-3xl p-3 min-[400px]:p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 min-[400px]:w-20 min-[400px]:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-linear-to-br from-violet-100 to-fuchsia-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={112}
                        height={112}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 break-words">
                            {item.name}
                          </h3>
                          {item.size && (
                            <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">
                              {getVariantKindLabel(
                                getVariantChoiceKind(item.size)
                              )}{" "}
                              <span className="font-semibold">
                                {formatVariantChoice(item.size)}
                              </span>
                            </p>
                          )}
                        </div>
                        <p className="text-sm min-[400px]:text-base sm:text-lg font-black text-gray-900 whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {formatPrice(item.price)} each
                      </p>

                      <div className="mt-auto pt-2.5 sm:pt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="flex items-center rounded-full bg-gray-100 p-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                  item.itemType,
                                  item.size,
                                  item.giftContents
                                )
                              }
                              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white hover:text-violet-600 disabled:opacity-40 disabled:hover:bg-transparent transition"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                  item.itemType,
                                  item.size,
                                  item.giftContents
                                )
                              }
                              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-white hover:text-violet-600 disabled:opacity-40 disabled:hover:bg-transparent transition"
                              disabled={atMax}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          {atMax ? (
                            <span className="text-xs font-medium text-amber-600">
                              Maximum available
                            </span>
                          ) : lowStock ? (
                            <span className="text-xs font-medium text-amber-600">
                              Only {item.stockQuantity} left
                            </span>
                          ) : null}
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.itemType,
                              item.size,
                              item.giftContents
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.giftContents && item.giftContents.length > 0 && (
                    <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl bg-violet-50/60 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 mb-1.5">
                        <Gift className="w-3.5 h-3.5 shrink-0" />
                        Gift includes
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {item.giftContents.map((content) => (
                          <li
                            key={`${content.productId}:${content.size ?? ""}`}
                            className="break-words"
                          >
                            {content.name}
                            {content.size
                              ? ` · ${getVariantKindLabel(
                                  getVariantChoiceKind(content.size)
                                )} ${formatVariantChoice(content.size)}`
                              : ""}{" "}
                            × {content.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="/"
              className="inline-flex items-center gap-2 py-1 text-sm font-semibold text-violet-700 hover:text-violet-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue shopping
            </Link>
          </div>

          {/* Summary */}
          <aside className="min-w-0 lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-6 lg:p-8 shadow-lg lg:sticky lg:top-8">
              <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">
                Order summary
              </h2>
              <div className="space-y-3 mb-5 sm:mb-6 text-sm">
                <div className="flex justify-between gap-3 text-gray-600">
                  <span className="min-w-0">
                    Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                  <strong className="text-gray-900 whitespace-nowrap">
                    {formatPrice(subtotal)}
                  </strong>
                </div>
                <div className="flex justify-between gap-3 text-gray-600">
                  <span>Delivery</span>
                  <strong className="text-gray-900 whitespace-nowrap">
                    {deliveryFeePending ? "Pending" : formatPrice(deliveryFee)}
                  </strong>
                </div>
                <div className="border-t-2 border-gray-100 pt-4 flex items-center justify-between gap-3 text-base sm:text-lg font-black">
                  <span>
                    Total
                    {deliveryFeePending && (
                      <span className="block text-xs font-medium text-gray-500">
                        Delivery fee pending
                      </span>
                    )}
                  </span>
                  <span className="bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent text-xl sm:text-2xl whitespace-nowrap">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {inventoryError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 break-words"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {inventoryError}
                </div>
              )}

              <Link
                href="/checkout"
                onClick={(event) => {
                  event.preventDefault();
                  void proceedToCheckout();
                }}
                aria-disabled={checkoutBusy}
                className={`w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:brightness-110 transition-all ${
                  checkoutBusy ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {checkoutBusy && <Loader2 className="w-5 h-5 animate-spin" />}
                {checkoutLabel}
                {!checkoutBusy && <ArrowRight className="w-5 h-5" />}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-3 sm:px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-4">
          <div className="min-w-0 shrink-0">
            <p className="text-[11px] sm:text-xs text-gray-500">
              Total{deliveryFeePending ? " (delivery pending)" : ""}
            </p>
            <p className="text-base sm:text-lg font-black text-violet-600 whitespace-nowrap">
              {formatPrice(total)}
            </p>
          </div>
          <Link
            href="/checkout"
            onClick={(event) => {
              event.preventDefault();
              void proceedToCheckout();
            }}
            aria-disabled={checkoutBusy}
            className={`flex-1 min-w-0 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3 sm:py-3.5 px-3 rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 text-center ${
              checkoutBusy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {checkoutBusy && <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
            <span className="truncate">{checkoutLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}