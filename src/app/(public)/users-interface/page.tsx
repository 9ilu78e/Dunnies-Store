"use client";

import Link from "next/link";
import { ArrowRight, PackagePlus, ShoppingBag, User } from "lucide-react";

export default function UsersInterfacePage() {
  return (
    <section className="bg-gradient-to-b from-purple-50 via-white to-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-10">
          <div className="flex items-center gap-3 text-purple-600 mb-6">
            <User className="w-6 h-6" />
            <p className="text-sm font-semibold tracking-wide uppercase">
              Users Interface
            </p>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back to your space
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl">
            Manage your orders, track deliveries, and stay on top of the latest
            deals curated just for you. Use the quick links below to jump right
            into the areas you care about the most.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/orders"
              className="group rounded-2xl border border-gray-200 p-6 hover:border-purple-200 hover:shadow-lg transition-all bg-gradient-to-br from-white to-purple-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Orders
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Review open purchases, download invoices, and track deliveries in
                real time.
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-purple-600 group-hover:gap-2 transition-all">
                View orders <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/cart"
              className="group rounded-2xl border border-gray-200 p-6 hover:border-pink-200 hover:shadow-lg transition-all bg-gradient-to-br from-white to-pink-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
                <PackagePlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Continue shopping
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Jump back into your cart, update quantities, or checkout securely
                in seconds.
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-pink-600 group-hover:gap-2 transition-all">
                Go to cart <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/contact"
              className="group rounded-2xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Need help?
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Reach our support team for order issues, product questions, or
                account updates any time.
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                Contact support <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

