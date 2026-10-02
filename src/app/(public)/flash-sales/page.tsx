import type { Metadata } from "next";
import { Flame, Sparkles } from "lucide-react";
import FlashSalesProducts from "@/components/product/FlashSalesProducts";

export const metadata: Metadata = {
  title: "Flash Sales – Dunnis Stores",
  description:
    "Shop limited-time Dunnis Stores deals before each offer expires.",
};

export default function FlashSalesPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-purple-50 via-white to-pink-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-3xl bg-linear-to-r from-purple-800 via-fuchsia-700 to-rose-600 p-6 text-white shadow-xl sm:p-10">
          <div className="absolute -right-8 -top-12 opacity-15">
            <Flame className="h-56 w-56" />
          </div>
          <div className="relative max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Limited-time offers
            </p>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Flash Sales</h1>
            <p className="mt-3 max-w-2xl text-base text-purple-100 sm:text-lg">
              Discover special prices on selected products, all ending at the
              same time.
            </p>
          </div>
        </header>
        <FlashSalesProducts />
      </div>
    </main>
  );
}
