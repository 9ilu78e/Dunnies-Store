"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Loader from "@/components/ui/Loader";
import ProductList from "@/components/product/ProductList";

interface Grocery {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

export default function FeaturedGroceries() {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const response = await fetch("/api/groceries");
        if (response.ok) {
          const data = await response.json();
          setGroceries((data.groceries || []).slice(0, 2));
        }
      } catch (error) {
        console.error("Failed to fetch groceries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroceries();
  }, []);

  const formattedGroceries = groceries.map((gr) => ({
    id: gr.id,
    name: gr.name,
    price: gr.price,
    image: gr.imageUrl || "https://via.placeholder.com/400x400",
    description: gr.description,
    rating: 4.5,
    reviews: 0,
    href: `/product/${gr.id}`,
  }));

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10 lg:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Featured Groceries
            </h2>
            <p className="text-lg text-gray-600">
              Fresh essentials delivered to your door
            </p>
          </div>
          <Link
            href="/groceries"
            className="hidden sm:flex items-center space-x-2 text-purple-600 font-semibold hover:text-purple-700 group"
          >
            <span>View All</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <Loader text="Loading featured groceries..." />
        ) : groceries.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-600">No groceries available yet.</p>
          </div>
        ) : (
          <ProductList products={formattedGroceries} cols={2} gap={8} />
        )}
      </div>
    </section>
  );
}
