"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    totalItems,
  } = useCart();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;
  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-700 mb-4">
            Your cart is empty
          </h2>
          <Link href="/" className="text-violet-600 font-bold underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-gray-900 mb-8">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <p className="text-2xl font-black text-violet-600 mb-4">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-100 rounded-xl px-4 py-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="hover:text-violet-600"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="mx-4 font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="hover:text-violet-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 flex items-center gap-2 text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-black">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-lg sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <strong>{formatPrice(deliveryFee)}</strong>
                </div>
                <div className="border-t-2 pt-4 flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-violet-600">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl transition-all"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
