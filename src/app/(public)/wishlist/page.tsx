"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (itemId: number | string) => {
    const product = items.find((item) => item.id === itemId);
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image:
        product.image ||
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80",
    });
  };

  if (items.length === 0) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6 bg-white rounded-3xl shadow-md border border-gray-100 p-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Your wishlist is waiting
          </h1>
          <p className="text-gray-600">
            Save gifts, gadgets, and cart restocks here. When you see something
            you love, tap the heart icon to keep it handy.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition"
            >
              Start shopping
            </Link>
            <Link
              href="/gifts"
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 text-purple-700 px-6 py-3 font-semibold hover:bg-purple-50 transition"
            >
              Browse gifts
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
              Wishlist
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mt-1">
              Saved items ({items.length})
            </h1>
            <p className="text-gray-600 mt-2">
              Keep tabs on gifts and pick up where you left off.
            </p>
          </div>
          <button
            onClick={clearWishlist}
            className="self-start inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear wishlist
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition flex flex-col gap-4 md:flex-row md:items-center"
            >
              <div className="w-full md:w-32 h-40 bg-gray-50 rounded-2xl overflow-hidden">
                <img
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-base font-bold text-purple-600">
                      ₦{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="text-sm text-gray-500 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAddToCart(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 text-white px-5 py-3 font-semibold hover:bg-purple-700 transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Move to cart
                  </button>
                  <Link
                    href={
                      item.href && item.href !== "#"
                        ? item.href
                        : typeof item.id === "string"
                        ? `/product/${item.id}`
                        : "/product"
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

