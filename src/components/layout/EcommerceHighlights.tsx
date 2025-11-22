"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart, Truck, Wallet, Headphones } from "lucide-react";

const highlights = [
  {
    title: "1-Hour Express Cart",
    description: "Checkout, pay, and get gifts moving in under 60 minutes.",
    icon: ShoppingCart,
    href: "/checkout",
    accent: "bg-purple-100 text-purple-600",
    cta: "Go to checkout",
  },
  {
    title: "Nationwide Delivery",
    description: "Tracked shipping with SMS updates on every milestone.",
    icon: Truck,
    href: "/orders",
    accent: "bg-blue-100 text-blue-600",
    cta: "Track orders",
  },
  {
    title: "Wallet & Pay Later",
    description: "Split payments or store cards securely with encrypted vaults.",
    icon: Wallet,
    href: "/payment-methods",
    accent: "bg-emerald-100 text-emerald-600",
    cta: "Manage payments",
  },
  {
    title: "24/7 Concierge",
    description: "Live help for gift ideas, order edits, and product sourcing.",
    icon: Headphones,
    href: "/help",
    accent: "bg-amber-100 text-amber-600",
    cta: "Visit help center",
  },
];

export default function EcommerceHighlights() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mb-2">
            Why shop Dunnis
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Premium shopping made simple and convenient
          </h2>
          <p className="text-gray-600">
            Experience seamless transactions, lightning-fast delivery, and dedicated support designed to make every moment special.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition bg-gray-50/70"
            >
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${item.accent}`}
              >
                <item.icon className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                {item.title}
              </h3>
              <p className="text-gray-600 mt-2">{item.description}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                {item.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

