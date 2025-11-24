"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductList from "@/components/product/ProductList";

interface Gift {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

export default function FeaturedGifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const response = await fetch("/api/gifts");
        if (response.ok) {
          const data = await response.json();
          setGifts((data.gifts || []).slice(0, 2));
        }
      } catch (error) {
        console.error("Failed to fetch gifts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGifts();
  }, []);

  const formattedGifts = gifts.map((g) => ({
    id: g.id,
    name: g.name,
    price: g.price,
    image: g.imageUrl || "https://via.placeholder.com/400x400",
    description: g.description,
    rating: 4.5,
    reviews: 0,
    href: `/product/${g.id}`,
  }));

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10 lg:mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Featured Gifts
            </h2>
            <p className="text-lg text-gray-600">
              Perfect presents for every occasion
            </p>
          </div>
          <Link
            href="/gift"
            className="hidden sm:flex items-center space-x-2 text-purple-600 font-semibold hover:text-purple-700 group"
          >
            <span>View All</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <Loader text="Loading featured gifts..." />
        ) : gifts.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-600">No gifts available yet.</p>
          </div>
        ) : (
          <ProductList products={formattedGifts} cols={2} gap={8} />
        )}
      </div>
    </section>
  );
}
