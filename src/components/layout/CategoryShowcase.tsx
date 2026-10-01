"use client";

import Link from "next/link";
import { ArrowRight, Zap, Package, Leaf } from "lucide-react";

const collections = [
  {
    id: 1,
    name: "Premium Gifts",
    description: "Curated gift selections crafted for moments that matter",
    color: "from-orange-600 to-red-600",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    href: "/gift",
    count: "500+ items",
  },
  {
    id: 2,
    name: "Souvenirs & Keepsakes",
    description: "Meaningful mementos and locally inspired treasures",
    color: "from-amber-600 to-orange-600",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    href: "/souvenirs",
    count: "Thoughtful finds",
  },
  {
    id: 3,
    name: "Premium Products",
    description: "Thoughtfully selected items for modern living",
    color: "from-slate-700 to-slate-900",
    textColor: "text-slate-700",
    bgColor: "bg-slate-50",
    href: "/product",
    count: "750+ items",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-10 sm:py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <div className="mb-4">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Shop Collections
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Discover Our Collections
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl font-light">
            Handpicked selections tailored to elevate your lifestyle experience
          </p>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 sm:mb-10 lg:mb-12">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group relative overflow-hidden"
            >
              <div
                className={`relative ${collection.bgColor} rounded-2xl p-8 transition-all duration-500 hover:shadow-xl h-full flex flex-col justify-between`}
              >
                {}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${collection.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                />

                <div>
                  {}
                  <div className="inline-block mb-4">
                    <span
                      className={`text-xs font-semibold ${collection.textColor} uppercase tracking-widest`}
                    >
                      {collection.count}
                    </span>
                  </div>

                  {}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-gray-900 group-hover:to-gray-700 transition-all duration-300">
                    {collection.name}
                  </h3>

                  {}
                  <p className="text-slate-600 text-base leading-relaxed mb-6">
                    {collection.description}
                  </p>
                </div>

                {}
                <div className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                  <span
                    className={`font-semibold text-sm ${collection.textColor}`}
                  >
                    Explore Collection
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full bg-linear-to-r ${collection.color} flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300`}
                  >
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 sm:py-8 lg:py-12 border-t border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <Zap className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Fast Delivery
              </h4>
              <p className="text-sm text-slate-600">
                Quick, reliable shipping to your door
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <Package className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Quality Assured
              </h4>
              <p className="text-sm text-slate-600">
                Every item carefully vetted and checked
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <Leaf className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Sustainable</h4>
              <p className="text-sm text-slate-600">
                Eco-conscious choices for conscious buyers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
