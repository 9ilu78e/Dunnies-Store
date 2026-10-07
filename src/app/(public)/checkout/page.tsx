"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatSavedAddress, useCheckout } from "./useCheckout";
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

const getItemImage = (item: unknown): string | undefined => {
  const i = item as { image?: string; imageUrl?: string };
  return i.image || i.imageUrl || undefined;
};

const inputClass = (invalid: boolean) =>
  `w-full min-w-0 pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 bg-white text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:ring-4 ${
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
    <div className="flex items-center gap-3 mb-4 sm:mb-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0 text-violet-600" />
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
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

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
                active ? "text-gray-900" : "text-gray-500"
              } ${active ? "" : "hidden sm:inline"}`}
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

export default function CheckoutPage() {
  const {
    authLoading,
    isAuthenticated,
    paymentMethod,
    setPaymentMethod,
    setSavedPaymentMethodId,
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
    paymentMethods,
    canSubmit,
    submitLabel,
    recheckInventory,
    usingSaved,
    missing,
  } = useCheckout();

  useEffect(() => {
    if (step !== "success") return;
    const successElement = document.getElementById("checkout-success");
    if (successElement) {
      successElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center bg-linear-to-br from-violet-50 to-fuchsia-50">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-gray-600">
          {authLoading ? "Loading checkout..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div id="checkout-success" className="min-h-screen overflow-x-hidden bg-linear-to-br from-violet-50 to-fuchsia-50 flex flex-col items-center justify-center px-3 py-6 sm:p-4 gap-5 sm:gap-6">
        <div className="w-full max-w-md flex justify-center">
          <Stepper current={3} />
        </div>
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 min-[400px]:p-6 sm:p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <CheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Order confirmed</h2>
          <p className="text-gray-500 text-sm mb-4">Your order number</p>
          <p className="inline-block max-w-full break-all rounded-2xl bg-violet-50 px-4 sm:px-5 py-2 text-lg sm:text-xl font-bold text-violet-700 mb-5 sm:mb-6">
            #{orderId}
          </p>

          {placed && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 sm:px-5 py-3 mb-5 text-sm">
              <span className="text-gray-600">
                {placed.count} {placed.count === 1 ? "item" : "items"}
              </span>
              <strong className="text-gray-900 whitespace-nowrap">{formatPrice(placed.total)}</strong>
            </div>
          )}

          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            {paymentMethod === "pay-on-delivery"
              ? "Your order is confirmed. Payment is due on delivery."
              : "Your order is created, but payment has not yet been confirmed. Payment is required before delivery."}
          </p>
          {paymentStartupError && (
            <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800 break-words">
              {paymentStartupError}
              <Link href="/orders" className="mt-2 block font-semibold underline">
                Open My Orders to retry payment
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href={`/orders?orderNumber=${orderId}`}
              className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold inline-flex items-center justify-center gap-2 hover:shadow-lg transition"
            >
              View my order
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="w-full border-2 border-gray-200 text-gray-700 py-3 sm:py-3.5 rounded-2xl font-bold inline-block hover:bg-gray-50 transition"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-br from-violet-50 to-fuchsia-50 py-5 sm:py-8 pb-36 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Checkout</h1>
          <Stepper current={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
          {/* Form */}
          <div className="min-w-0 lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 1. Contact */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-8 shadow-lg">
              <SectionTitle
                step={1}
                icon={User}
                title="Contact details"
                subtitle="We use these to reach you about your order."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="min-w-0 sm:col-span-2">
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
            <section className="bg-white rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-8 shadow-lg">
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
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
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
                        className={`min-w-0 text-left rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 transition ${
                          active
                            ? "border-violet-600 bg-violet-50"
                            : "border-gray-200 hover:border-violet-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2 font-bold text-gray-900 text-sm">
                            <MapPin className="w-4 h-4 shrink-0 text-violet-600" />
                            <span className="truncate">{address.label}</span>
                          </span>
                          {address.isDefault && (
                            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-800 break-words">
                          {address.recipient}
                        </p>
                        <p className="text-xs text-gray-600 whitespace-pre-line break-words mt-0.5">
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
                    className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border-2 border-dashed p-3 sm:p-4 text-sm font-semibold transition ${
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
                    className={`${inputClass(missing.address)} resize-none pt-3 sm:pt-3.5`}
                  />
                </Field>
              )}
            </section>

            {/* 3. Payment */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-8 shadow-lg">
              <SectionTitle
                step={3}
                icon={CreditCard}
                title="Payment method"
                subtitle="Pick how you would like to pay."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                {paymentMethods.map((m) => {
                  const active = paymentMethod === m.value;
                  return (
                    <label
                      key={m.value}
                      className={`relative block min-w-0 p-3.5 min-[400px]:p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all focus-within:ring-4 focus-within:ring-violet-100 ${
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
                        onChange={(event) => {
                          const selectedMethod = event.target.value;
                          setPaymentMethod(selectedMethod);
                          setSavedPaymentMethodId(
                            selectedMethod.startsWith("paystack-saved:")
                              ? selectedMethod.slice("paystack-saved:".length)
                              : ""
                          );
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
                            active ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          <m.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 pr-6">
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{m.label}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                      <span
                        className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
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
              {paymentMethod.startsWith("paystack") && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={savePaymentMethod}
                    onChange={(event) => setSavePaymentMethod(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-purple-600"
                  />
                  <span>
                    Save this eligible card for future Paystack orders. Paystack securely handles the card; Dunnis Stores never stores your full card number.
                  </span>
                </label>
              )}
            </section>

            {inventoryError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-700 break-words"
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
                className="flex-1 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-4 px-3 rounded-2xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
                {submitLabel}
                {!submitting && <ArrowRight className="w-5 h-5 shrink-0" />}
              </button>
            </div>
            {!paymentMethod && items.length > 0 && (
              <p className="hidden lg:block text-xs text-gray-500 -mt-3">
                Choose a payment method to continue.
              </p>
            )}
          </div>

          {/* Summary */}
          <aside className="min-w-0 lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-6 lg:p-8 shadow-lg lg:sticky lg:top-8">
              <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-5 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 shrink-0 text-violet-600" />
                Order summary
                <span className="ml-auto shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
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
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-violet-100 to-fuchsia-100">
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
                            <p className="text-xs text-gray-500 truncate">{item.size}</p>
                          )}
                        </div>
                        <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-4 sm:pt-5 text-sm">
                <div className="flex justify-between gap-3 text-gray-600">
                  <span>Subtotal</span>
                  <strong className="text-gray-900 whitespace-nowrap">{formatPrice(subtotal)}</strong>
                </div>
                <div className="flex justify-between gap-3 text-gray-600">
                  <span>Delivery</span>
                  <strong className="text-gray-900 whitespace-nowrap">
                    {deliveryFeePending ? "Pending" : formatPrice(deliveryFee)}
                  </strong>
                </div>
                {deliveryFeePending && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p>
                      Delivery fees are missing for one or more items. They must
                      be available before you can place this order.
                    </p>
                    <button
                      type="button"
                      onClick={() => void recheckInventory()}
                      disabled={inventoryChecking}
                      className="mt-2 font-semibold text-amber-950 underline underline-offset-2 disabled:opacity-60"
                    >
                      {inventoryChecking
                        ? "Rechecking fees..."
                        : "Recheck delivery fees"}
                    </button>
                  </div>
                )}
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
            <p className="text-base sm:text-lg font-black text-violet-600 whitespace-nowrap">{formatPrice(total)}</p>
          </div>
          <button
            onClick={() => void placeOrder()}
            disabled={!canSubmit}
            className="flex-1 min-w-0 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-3 sm:py-3.5 px-3 rounded-2xl text-xs min-[400px]:text-sm sm:text-base leading-tight font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-center"
          >
            {submitting && <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}