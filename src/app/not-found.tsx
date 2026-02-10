"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-purple-50 via-white to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full text-center bg-white rounded-3xl shadow-2xl border border-purple-100 p-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-purple-600 to-pink-500 text-white text-4xl font-bold shadow-lg mb-8">
          404
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Oops! Page not found
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          We couldn’t find the page you were looking for. It might have been
          removed, renamed, or never existed. Try heading back home or explore
          our latest collections.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:border-purple-400 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-purple-200 transition"
          >
            <Search className="w-5 h-5" />
            Explore Products
          </Link>
        </div>
      </div>
    </main>
  );
}
