"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductList from "@/components/product/ProductList";

interface Souvenir {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  averageRating: number;
  totalComments: number;
}

export default function FeaturedSouvenirs() {
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSouvenirs = async () => {
      try {
        const response = await fetch("/api/souvenirs");
        if (response.ok) {
          const data = await response.json();
          setSouvenirs((data.souvenirs || []).slice(0, 2));
        }
      } catch (error) {
        console.error("Failed to fetch souvenirs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSouvenirs();
  }, []);

  const formattedSouvenirs = souvenirs.map((souvenir) => ({
    id: souvenir.id,
    name: souvenir.name,
    price: souvenir.price,
    image: souvenir.imageUrl || "https://via.placeholder.com/400x400",
    description: souvenir.description,
    rating: souvenir.averageRating ?? 0,
    reviews: souvenir.totalComments ?? 0,
    href: `/souvenirs/${souvenir.id}`,
  }));

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10 lg:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Featured Souvenirs
            </h2>
            <p className="text-lg text-gray-600">
              Keepsakes and mementos for meaningful moments
            </p>
          </div>
          <Link
            href="/souvenirs"
            className="hidden sm:flex items-center space-x-2 text-purple-600 font-semibold hover:text-purple-700 group"
          >
            <span>View All</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <Loader text="Loading featured souvenirs..." />
        ) : souvenirs.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-600">No souvenirs available yet.</p>
          </div>
        ) : (
          <ProductList products={formattedSouvenirs} cols={2} gap={8} />
        )}
      </div>
    </section>
  );
}
