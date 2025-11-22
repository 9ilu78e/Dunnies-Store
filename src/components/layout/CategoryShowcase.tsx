"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Gift,
  ShoppingBag,
  Home,
  Star,
  TrendingUp,
  Heart,
} from "lucide-react";

const collections = [
  {
    id: 1,
    name: "Premium Gifts",
    description: "Thoughtfully curated gift selections for every occasion",
    icon: Gift,
    color: "from-rose-500 to-pink-500",
    badge: "Popular",
    items: "500+ Items",
    rating: "4.9",
    href: "/gift",
  },
  {
    id: 2,
    name: "Fresh Groceries",
    description: "Quality essentials delivered straight to your door",
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    badge: "New",
    items: "1000+ Items",
    rating: "4.8",
    href: "/groceries",
  },
  {
    id: 3,
    name: "Home & Living",
    description: "Everything you need to make your space perfect",
    icon: Home,
    color: "from-blue-500 to-indigo-500",
    badge: "Trending",
    items: "750+ Items",
    rating: "4.9",
    href: "/categories",
  },
];

const features = [
  { icon: TrendingUp, text: "Fast Delivery" },
  { icon: Heart, text: "Handpicked Quality" },
  { icon: Star, text: "Gift Wrapping Available" },
];

export default function CategoryShowcase() {
  return (
    <section className="py-24 bg-linear-to-br from-slate-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-5 py-2.5 rounded-full bg-white shadow-md border border-purple-100">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-sm font-bold tracking-wide text-purple-900">
              SHOP BY COLLECTION
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 mb-4">
            Explore Our Curated Collections
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Discover carefully selected collections designed to meet all your
            lifestyle needs
          </p>

          {/* Features Bar */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-700">
                <feature.icon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {collections.map((collection, idx) => {
            const IconComponent = collection.icon;
            return (
              <Link
                key={collection.id}
                href={collection.href}
                className="group relative"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute -inset-1 bg-linear-to-r ${collection.color} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}
                />

                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-gray-100 group-hover:border-transparent group-hover:-translate-y-2">
                  {/* Badge */}
                  <div className="absolute top-6 right-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-linear-to-r ${collection.color} shadow-md`}
                    >
                      {collection.badge}
                    </span>
                  </div>

                  {/* Icon with Floating Animation */}
                  <div className="relative mb-6">
                    <div
                      className={`w-20 h-20 rounded-2xl bg-linear-to-br ${collection.color} flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                    >
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    {/* Decorative Circle */}
                    <div
                      className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-linear-to-br ${collection.color} opacity-20 group-hover:scale-150 transition-transform duration-500`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                      {collection.name}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                      {collection.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-700">
                          {collection.rating}
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-gray-600 font-medium">
                        {collection.items}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div
                    className={`flex items-center justify-between px-5 py-3 rounded-xl bg-linear-to-r ${collection.color} text-white font-semibold group-hover:shadow-lg transition-all duration-300`}
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Can't Find What You're Looking For?
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Browse our complete catalog with hundreds of products across all
            categories
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 px-10 py-4 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group text-lg"
          >
            Browse All Categories
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
