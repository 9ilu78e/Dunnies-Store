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
        <div className="text-center p-4">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Your cart is empty
          </h2>
          <Link
            href="/"
            className="text-violet-600 font-bold underline hover:text-violet-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 mb-8 sm:mb-10">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-lg sm:text-xl font-black text-violet-600 mb-3 sm:mb-4">
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center bg-gray-100 rounded-xl p-1 sm:px-2 sm:py-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1 sm:p-2 hover:text-violet-600 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="mx-2 sm:mx-4 font-bold w-6 text-center text-sm sm:text-base">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 sm:p-2 hover:text-violet-600"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 flex items-center gap-1 sm:gap-2 text-sm font-semibold hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right mt-4 sm:mt-0 flex flex-col justify-center">
                    <p className="text-sm text-gray-500">Item Total</p>
                    <p className="text-lg sm:text-xl font-black">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl lg:sticky lg:top-8">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <strong className="text-gray-900">
                    {formatPrice(subtotal)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Delivery</span>
                  <strong className="text-gray-900">
                    {formatPrice(deliveryFee)}
                  </strong>
                </div>
                <div className="border-t-2 pt-4 flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span className="text-violet-600">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 sm:py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-2xl hover:brightness-110 transition-all text-base"
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
