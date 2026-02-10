import Link from "next/link";
import { ArrowRight, ShoppingBag, GiftIcon } from "lucide-react";

export default function PromoBanners() {
  return (
    <section className="py-12 bg-linear-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Link
            href="/gifts/premium"
            className="relative min-h-64 sm:min-h-72 aspect-4/3 sm:aspect-auto rounded-xl sm:rounded-3xl overflow-hidden group block shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"
              alt="Premium Gifts"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-linear-to-br from-violet-900/95 via-purple-900/90 to-transparent">
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/30">
                <div className="flex items-center gap-2">
                  <GiftIcon className="w-4 h-4 text-yellow-300" />
                  <span className="text-white text-xs sm:text-sm font-bold">
                    SPECIAL COLLECTION
                  </span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3 leading-tight">
                  Premium Gifts
                </h3>
                <p className="text-white/90 text-xs sm:text-base mb-4 sm:mb-6 font-medium">
                  Up to 40% off selected items
                </p>
                <div className="bg-white text-violet-600 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-violet-50 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03] text-sm sm:text-base">
                  <span>Shop Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-linear-to-br from-yellow-400 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-xl transform rotate-3">
                40% OFF
              </div>
            </div>
          </Link>

          <Link
            href="/groceries/organic"
            className="relative min-h-64 sm:min-h-72 aspect-4/3 sm:aspect-auto rounded-xl sm:rounded-3xl overflow-hidden group block shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            <img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80"
              alt="Organic Groceries"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-linear-to-br from-emerald-900/95 via-green-900/90 to-transparent">
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/30">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-green-300" />
                  <span className="text-white text-xs sm:text-sm font-bold">
                    FRESH DAILY
                  </span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3 leading-tight">
                  Organic Groceries
                </h3>
                <p className="text-white/90 text-xs sm:text-base mb-4 sm:mb-6 font-medium">
                  Farm fresh produce delivered today
                </p>
                <div className="bg-white text-emerald-600 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-emerald-50 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03] text-sm sm:text-base">
                  <span>Order Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-linear-to-br from-green-400 to-emerald-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-xl transform -rotate-3">
                FRESH
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
