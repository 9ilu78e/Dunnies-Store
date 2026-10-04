"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { showToast } from "@/components/ui/Toast";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [inventoryError, setInventoryError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
  });
  const { items, clearCart } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 2500;
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
          notes: `Delivery address: ${deliveryDetails.address.trim()}\nPayment method: ${paymentMethod}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We could not place your order.");
      }
      setOrderId(data.order.id);
      clearCart();
      setStep("success");
    } catch (error) {
      console.error("Unable to place order:", error);
      setInventoryError(
        error instanceof Error
          ? error.message
          : "We could not place your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      value: "pay-before-delivery",
      label: "Pay Before Delivery",
      icon: CreditCard,
      desc: "We will contact you with payment instructions.",
    },
    {
      value: "pay-on-delivery",
      label: "Pay On Delivery",
      icon: Truck,
      desc: "Cash or POS on delivery",
    },
  ];

  if (step === "success") {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          <div className="w-24 h-24 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-4">Order Confirmed!</h2>
          <p className="text-xl font-bold text-violet-600 mb-6">
            #{orderId}
          </p>
          <p className="text-gray-600 mb-8">
            {paymentMethod === "pay-on-delivery"
              ? "Your order is confirmed. Payment is due on delivery."
              : "Your order is confirmed. We will contact you with payment instructions."}
          </p>
          <Link
            href="/"
            className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-5 rounded-2xl font-bold inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 to-fuchsia-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Package className="w-7 h-7 text-violet-600" /> Delivery
                Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={deliveryDetails.customerName}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={deliveryDetails.customerPhone}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerPhone: event.target.value,
                      }))
                    }
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={deliveryDetails.customerEmail}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerEmail: event.target.value,
                      }))
                    }
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    rows={3}
                    placeholder="Delivery Address"
                    value={deliveryDetails.address}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <CreditCard className="w-7 h-7 text-violet-600" /> Payment
                Method
              </h2>
              <div className="space-y-4">
                {paymentMethods.map((m) => (
                  <label
                    key={m.value}
                    className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === m.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 ${
                          paymentMethod === m.value
                            ? "border-violet-600"
                            : "border-gray-300"
                        } flex items-center justify-center`}
                      >
                        {paymentMethod === m.value && (
                          <div className="w-3 h-3 bg-violet-600 rounded-full" />
                        )}
                      </div>
                      <m.icon className="w-6 h-6 text-violet-600" />
                      <div>
                        <p className="font-bold">{m.label}</p>
                        <p className="text-sm text-gray-600">{m.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Link
                  href="/cart"
                  className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-center"
                >
                  Back to Cart
                </Link>
                <button
                  onClick={() => void placeOrder()}
                  disabled={
                    !paymentMethod || items.length === 0 || submitting
                  }
                  className="flex-1 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? "Placing Order..."
                    : paymentMethod === "pay-on-delivery"
                    ? "Place Order"
                    : "Continue to Payment"}{" "}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              {inventoryError && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {inventoryError}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <strong>{formatPrice(deliveryFee)}</strong>
                </div>
                <div className="border-t-2 pt-4 flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span className="text-violet-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
