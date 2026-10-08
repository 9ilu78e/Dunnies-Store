"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatOrderNumber } from "@/lib/orderNumber";
import { summarizeDeliveryFees } from "@/lib/deliveryFees";

type SavedPaymentMethodSummary = {
  id: string;
  brand: string | null;
  cardType: string | null;
  last4: string;
  expMonth: string;
  expYear: string;
  bank: string | null;
  isDefault: boolean;
};

export type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export const formatSavedAddress = (address: SavedAddress) =>
  [
    address.line1,
    address.line2,
    [address.city, address.region, address.postalCode, address.country]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

export function useCheckout() {

  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState("");
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    SavedPaymentMethodSummary[]
  >([]);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [inventoryError, setInventoryError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentStartupError, setPaymentStartupError] = useState("");
  const [placed, setPlaced] = useState<{ total: number; count: number } | null>(
    null
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLoading, setAddressLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
  });
  const cartRefreshed = useRef(false);
  const {
    items,
    clearCart,
    refreshInventory,
    inventoryChecking,
  } = useCart();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      sessionStorage.setItem("dunnis:returnTo", "/checkout");
      router.replace("/login");
      setAddressLoading(false);
      return;
    }

    let cancelled = false;
    const loadAccountDetails = async () => {
      try {
        const [accountResponse, addressesResponse, paymentMethodsResponse] = await Promise.all([
          fetch("/api/account", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/addresses", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/payment-methods", {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);
        const accountData = accountResponse.ok
          ? await accountResponse.json()
          : null;
        const addressesData = addressesResponse.ok
          ? await addressesResponse.json()
          : null;
        const paymentMethodsData = paymentMethodsResponse.ok
          ? await paymentMethodsResponse.json()
          : null;
        if (cancelled) return;
        setSavedPaymentMethods(
          Array.isArray(paymentMethodsData?.paymentMethods)
            ? paymentMethodsData.paymentMethods
            : []
        );
        if (sessionStorage.getItem("dunnis:savePaymentMethod") === "true") {
          setSavePaymentMethod(true);
          sessionStorage.removeItem("dunnis:savePaymentMethod");
        }
        if (accountData?.user) {
          setDeliveryDetails((current) => ({
            ...current,
            customerName: accountData.user.fullName || current.customerName,
            customerPhone: accountData.user.phone || current.customerPhone,
            customerEmail: accountData.user.email || current.customerEmail,
          }));
        }
        const addresses = (addressesData?.addresses || []) as SavedAddress[];
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((address) => address.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setDeliveryDetails((current) => ({
            ...current,
            customerName: defaultAddress.recipient,
            customerPhone: defaultAddress.phone,
            address: formatSavedAddress(defaultAddress),
          }));
        }
      } catch (error) {
        console.error("Unable to load saved checkout details:", error);
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    };

    void loadAccountDetails();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      items.length === 0 ||
      cartRefreshed.current
    ) {
      return;
    }

    cartRefreshed.current = true;
    void refreshInventory()
      .then((unavailable) => {
        if (unavailable.length > 0) {
          setInventoryError(
            "Unavailable items were removed from your cart. Please review your order."
          );
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to refresh checkout inventory:", error);
        setInventoryError(
          "We could not verify current prices and delivery fees. Please try again."
        );
      });
  }, [authLoading, isAuthenticated, items.length, refreshInventory]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { total: deliveryFee, pending: deliveryFeePending } =
    summarizeDeliveryFees(items);
  const total = subtotal + deliveryFee;
  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const placeOrder = async () => {
    setInventoryError("");
    if (deliveryFeePending) {
      setInventoryError(
        "We could not calculate delivery for every item. Recheck the fees or contact support before placing your order."
      );
      return;
    }
    if (
      !deliveryDetails.customerName.trim() ||
      !deliveryDetails.customerPhone.trim() ||
      !deliveryDetails.customerEmail.trim() ||
      !deliveryDetails.address.trim()
    ) {
      setShowErrors(true);
      setInventoryError("Enter your name, phone, email, and delivery address.");
      return;
    }
    if (!paymentMethod || items.length === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: deliveryDetails.customerName.trim(),
          customerPhone: deliveryDetails.customerPhone.trim(),
          customerEmail: deliveryDetails.customerEmail.trim(),
          deliveryAddress: deliveryDetails.address.trim(),
          paymentMethod: paymentMethod.startsWith("paystack")
            ? "paystack"
            : paymentMethod,
          items: items.map((item) => ({
            itemId: String(item.id),
            itemType: item.itemType,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            ...(item.size ? { size: item.size } : {}),
            ...(item.giftContents
              ? {
                  giftContents: item.giftContents.map((content) => ({
                    productId: content.productId,
                    quantity: content.quantity,
                    ...(content.size ? { size: content.size } : {}),
                  })),
                }
              : {}),
          })),
          total,
          source: "site",
          notes: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We could not place your order.");
      }
      setOrderId(formatOrderNumber(data.order.orderNumber));
      if (paymentMethod.startsWith("paystack")) {
        const paymentResponse = await fetch("/api/paystack/initialize", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.order.id,
            savePaymentMethod,
            ...(savedPaymentMethodId ? { savedPaymentMethodId } : {}),
          }),
        });
        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(
            `Order #${formatOrderNumber(data.order.orderNumber)} was created, but payment could not start. ${paymentData.error || "Please retry payment from My Orders."}`
          );
        }
        if (paymentData.paymentStatus === "pending") {
          setPlaced({
            total: Number(data.order.total ?? total),
            count: itemCount,
          });
          setPaymentStartupError(
            paymentData.message ||
              "Your saved-card payment is awaiting confirmation. Check your order status before retrying."
          );
          clearCart();
          setStep("success");
          return;
        }
        if (typeof paymentData.authorizationUrl !== "string") {
          if (paymentData.paymentStatus === "paid") {
            setPlaced({
              total: Number(data.order.total ?? total),
              count: itemCount,
            });
            clearCart();
            setStep("success");
            return;
          }
          throw new Error("Paystack did not return a payment link.");
        }
        clearCart();
        window.location.assign(paymentData.authorizationUrl);
        return;
      }
      setPlaced({ total: Number(data.order.total ?? total), count: itemCount });
      clearCart();
      setStep("success");
    } catch (error) {
      console.error("Unable to place order:", error);
      setInventoryError(
        error instanceof Error
          ? error.message
          : "We could not place your order. Please try again."
      );
      if (
        error instanceof Error &&
        /Order #([A-Z0-9]+) was created/.test(error.message)
      ) {
        setPaymentStartupError(error.message);
        setStep("success");
        clearCart();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const recheckInventory = async () => {
    setInventoryError("");
    try {
      const unavailable = await refreshInventory();
      if (unavailable.length > 0) {
        setInventoryError(
          "Unavailable items were removed from your cart. Please review your order."
        );
      }
    } catch (error) {
      console.error("Unable to recheck checkout delivery fees:", error);
      setInventoryError(
        error instanceof Error
          ? error.message
          : "We could not recalculate delivery fees. Please try again."
      );
    }
  };

  const paymentMethods = [
    {
      value: "paystack",
      label: "Pay now with Paystack",
      icon: CreditCard,
      desc: "Secure online payment is required before your order is sent for delivery.",
    },
    ...savedPaymentMethods.map((method) => ({
      value: `paystack-saved:${method.id}`,
      label: `${method.brand || method.cardType || "Card"} •••• ${method.last4}`,
      icon: CreditCard,
      desc: `Saved Paystack card · expires ${method.expMonth}/${method.expYear}`,
    })),
    {
      value: "pay-on-delivery",
      label: "Pay On Delivery",
      icon: Truck,
      desc: "Cash or POS on delivery",
    },
  ];

  const canSubmit =
    Boolean(paymentMethod) &&
    items.length > 0 &&
    !deliveryFeePending &&
    !submitting &&
    !inventoryChecking;

  const submitLabel = submitting
    ? "Placing order..."
    : paymentMethod === "pay-on-delivery"
    ? "Place order"
    : "Pay now — payment required before delivery";

  const usingSaved = Boolean(
    selectedAddressId && selectedAddressId !== "custom"
  );

  const missing = {
    name: showErrors && !deliveryDetails.customerName.trim(),
    phone: showErrors && !deliveryDetails.customerPhone.trim(),
    email: showErrors && !deliveryDetails.customerEmail.trim(),
    address: showErrors && !deliveryDetails.address.trim(),
  };

  return {
    authLoading,
    isAuthenticated,
    paymentMethod,
    setPaymentMethod,
    setSavedPaymentMethodId,
    savedPaymentMethodId,
    savedPaymentMethods,
    savePaymentMethod,
    setSavePaymentMethod,
    step,
    inventoryError,
    submitting,
    inventoryChecking,
    orderId,
    paymentStartupError,
    placed,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    addressLoading,
    showErrors,
    deliveryDetails,
    setDeliveryDetails,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    deliveryFeePending,
    total,
    formatPrice,
    placeOrder,
    recheckInventory,
    paymentMethods,
    canSubmit,
    submitLabel,
    usingSaved,
    missing,
  };
}
