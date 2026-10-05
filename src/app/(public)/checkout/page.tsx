"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Plus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatOrderNumber } from "@/lib/orderNumber";
import { summarizeDeliveryFees } from "@/lib/deliveryFees";

type SavedAddress = {
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

const formatSavedAddress = (address: SavedAddress) =>
  [
    address.line1,
    address.line2,
    [address.city, address.region, address.postalCode, address.country]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

const getItemImage = (item: unknown): string | undefined => {
  const i = item as { image?: string; imageUrl?: string };
  return i.image || i.imageUrl || undefined;
};

const inputClass = (invalid: boolean) =>
  `w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-4 ${
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-violet-500 focus:ring-violet-100"
  }`;

function SectionTitle({
  step,
  icon: Icon,
  title,
  subtitle,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-violet-600" />
          {title}
        </h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Cart", "Delivery and payment", "Confirmation"];
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm" aria-label="Checkout progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
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
              className={`font-semibold ${
                active ? "text-gray-900" : "text-gray-500"
              } ${active ? "" : "hidden sm:inline"}`}
            >
              {label}
            </span>
            {n < steps.length && <span className="h-px w-6 sm:w-10 bg-gray-300" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("");
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
        const [accountResponse, addressesResponse] = await Promise.all([
          fetch("/api/account", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/addresses", {
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
        if (cancelled) return;
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
          paymentMethod,
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
      if (paymentMethod === "paystack") {
        const paymentResponse = await fetch("/api/paystack/initialize", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.order.id }),
        });
        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(
            `Order #${formatOrderNumber(data.order.orderNumber)} was created, but payment could not start. ${paymentData.error || "Please retry payment from My Orders."}`
          );
        }
        if (typeof paymentData.authorizationUrl !== "string") {
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

  const paymentMethods = [
    {
      value: "paystack",
      label: "Pay now with Paystack",
      icon: CreditCard,
      desc: "Secure online payment is required before your order is sent for delivery.",
    },
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

  /* ---------------------------------------------------------------- */

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-linear-to-br from-violet-50 to-fuchsia-50">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-gray-600">
          {authLoading ? "Loading checkout..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 to-fuchsia-50 flex flex-col items-center justify-center p-4 gap-6">
        <Stepper current={3} />
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-11 h-11 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2">Order confirmed</h2>
          <p className="text-gray-500 text-sm mb-4">Your order number</p>
          <p className="inline-block rounded-2xl bg-violet-50 px-5 py-2 text-xl font-bold text-violet-700 mb-6">
            #{orderId}
          </p>

          {placed && (
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-5 py-3 mb-5 text-sm">
              <span className="text-gray-600">
                {placed.count} {placed.count === 1 ? "item" : "items"}
              </span>
              <strong className="text-gray-900">{formatPrice(placed.total)}</strong>
            </div>
          )}

          <p className="text-gray-600 mb-8">
            {paymentMethod === "pay-on-delivery"
              ? "Your order is confirmed. Payment is due on delivery."
              : "Your order is created, but payment has not yet been confirmed. Payment is required before delivery."}
          </p>
          {paymentStartupError && (
            <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800">
              {paymentStartupError}
              <Link href="/orders" className="mt-2 block font-semibold underline">
                Open My Orders to retry payment
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href={`/orders?orderNumber=${orderId}`}
              className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-2xl font-bold inline-flex items-center justify-center gap-2 hover:shadow-lg transition"
            >
              View my order
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold inline-block hover:bg-gray-50 transition"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 to-fuchsia-50 py-8 pb-32 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900">Checkout</h1>
          <Stepper current={2} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Contact */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <SectionTitle
                step={1}
                icon={User}
                title="Contact details"
                subtitle="We use these to reach you about your order."
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Full name"
                  htmlFor="co-name"
                  icon={User}
                  error={missing.name ? "Enter your full name" : undefined}
                >
                  <input
                    id="co-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={deliveryDetails.customerName}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    required
                    className={inputClass(missing.name)}
                  />
                </Field>
                <Field
                  label="Phone number"
                  htmlFor="co-phone"
                  icon={Phone}
                  error={missing.phone ? "Enter a phone number" : undefined}
                >
                  <input
                    id="co-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+234 800 000 0000"
                    value={deliveryDetails.customerPhone}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerPhone: event.target.value,
                      }))
                    }
                    required
                    className={inputClass(missing.phone)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field
                    label="Email"
                    htmlFor="co-email"
                    icon={Mail}
                    error={missing.email ? "Enter your email address" : undefined}
                  >
                    <input
                      id="co-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={deliveryDetails.customerEmail}
                      onChange={(event) =>
                        setDeliveryDetails((current) => ({
                          ...current,
                          customerEmail: event.target.value,
                        }))
                      }
                      required
                      className={inputClass(missing.email)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* 2. Address */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <SectionTitle
                step={2}
                icon={Package}
                title="Delivery address"
                subtitle="Choose a saved address or enter a new one."
              />

              {addressLoading && (
                <p className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading your saved addresses...
                </p>
              )}

              {savedAddresses.length > 0 && (
                <div
                  role="radiogroup"
                  aria-label="Saved delivery addresses"
                  className="grid sm:grid-cols-2 gap-3 mb-4"
                >
                  {savedAddresses.map((address) => {
                    const active = selectedAddressId === address.id;
                    return (
                      <button
                        key={address.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setSelectedAddressId(address.id);
                          setDeliveryDetails((current) => ({
                            ...current,
                            customerName: address.recipient,
                            customerPhone: address.phone,
                            address: formatSavedAddress(address),
                          }));
                        }}
                        className={`text-left rounded-2xl border-2 p-4 transition ${
                          active
                            ? "border-violet-600 bg-violet-50"
                            : "border-gray-200 hover:border-violet-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                            <MapPin className="w-4 h-4 text-violet-600" />
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-800">
                          {address.recipient}
                        </p>
                        <p className="text-xs text-gray-600 whitespace-pre-line mt-0.5">
                          {formatSavedAddress(address)}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedAddressId === "custom"}
                    onClick={() => {
                      setSelectedAddressId("custom");
                      setDeliveryDetails((current) => ({
                        ...current,
                        address: "",
                      }));
                    }}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-sm font-semibold transition ${
                      selectedAddressId === "custom"
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-gray-300 text-gray-600 hover:border-violet-300 hover:text-violet-700"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Use a different address
                  </button>
                </div>
              )}

              {!usingSaved && (
                <Field
                  label="Address"
                  htmlFor="co-address"
                  icon={MapPin}
                  error={missing.address ? "Enter a delivery address" : undefined}
                >
                  <textarea
                    id="co-address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="House number, street, city and state"
                    value={deliveryDetails.address}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    required
                    className={`${inputClass(missing.address)} resize-none pt-3.5`}
                  />
                </Field>
              )}
            </section>

            {/* 3. Payment */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <SectionTitle
                step={3}
                icon={CreditCard}
                title="Payment method"
                subtitle="Pick how you would like to pay."
              />
              <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                {paymentMethods.map((m) => {
                  const active = paymentMethod === m.value;
                  return (
                    <label
                      key={m.value}
                      className={`relative block p-5 rounded-2xl border-2 cursor-pointer transition-all focus-within:ring-4 focus-within:ring-violet-100 ${
                        active
                          ? "border-violet-600 bg-violet-50"
                          : "border-gray-200 hover:border-violet-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.value}
                        checked={active}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            active ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          <m.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 pr-6">
                          <p className="font-bold text-gray-900">{m.label}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                      <span
                        className={`absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          active
                            ? "border-violet-600 bg-violet-600"
                            : "border-gray-300"
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {inventoryError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                {inventoryError}
              </div>
            )}

            <div className="hidden lg:flex gap-4">
              <Link
                href="/cart"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to cart
              </Link>
              <button
                onClick={() => void placeOrder()}
                disabled={!canSubmit}
                className="flex-1 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-2xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitLabel}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
            {!paymentMethod && items.length > 0 && (
              <p className="hidden lg:block text-xs text-gray-500 -mt-3">
                Choose a payment method to continue.
              </p>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg lg:sticky lg:top-8">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
                Order summary
                <span className="ml-auto rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </h2>

              {items.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-600 mb-2">
                  <p className="mb-3">Your cart is empty.</p>
                  <Link
                    href="/"
                    className="font-semibold text-violet-700 hover:text-violet-900"
                  >
                    Continue shopping
                  </Link>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-3 mb-5">
                  {items.map((item, index) => {
                    const image = getItemImage(item);
                    return (
                      <li
                        key={`${item.id}-${item.size ?? ""}-${index}`}
                        className="flex items-center gap-3"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-violet-100 to-fuchsia-100">
                          {image ? (
                            <img
                              src={image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="w-5 h-5 text-violet-300" />
                            </div>
                          )}
                          <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-gray-900/80 px-1 text-[11px] font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </p>
                          {item.size && (
                            <p className="text-xs text-gray-500">{item.size}</p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <strong className="text-gray-900">{formatPrice(subtotal)}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <strong className="text-gray-900">
                    {deliveryFeePending ? "Pending" : formatPrice(deliveryFee)}
                  </strong>
                </div>
                <div className="border-t-2 border-gray-100 pt-4 flex items-center justify-between text-lg font-black">
                  <span>
                    Total
                    {deliveryFeePending && (
                      <span className="block text-xs font-medium text-gray-500">
                        Delivery fee pending
                      </span>
                    )}
                  </span>
                  <span className="bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent text-2xl">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              Total{deliveryFeePending ? " (delivery pending)" : ""}
            </p>
            <p className="text-lg font-black text-violet-600">{formatPrice(total)}</p>
          </div>
          <button
            onClick={() => void placeOrder()}
            disabled={!canSubmit}
            className="flex-1 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}