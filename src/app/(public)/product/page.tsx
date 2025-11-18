import type { Metadata } from "next";
import ProductsCatalog from "@/components/product/ProductsCatalog";

export const metadata: Metadata = {
  title: "All Products – Dunnis Stores",
};

const featuredProducts = [
  {
    id: 1,
    name: "Luxury Gift Basket",
    description: "Handpicked gourmet treats, ready to surprise.",
    price: 79900,
    originalPrice: 89900,
    rating: 4.8,
    reviews: 64,
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
    tag: "Gifts",
    href: "/product/luxury-gift-basket",
  },
  {
    id: 2,
    name: "Daily Essentials Pack",
    description: "Groceries and pantry staples bundled together.",
    price: 25900,
    rating: 4.6,
    reviews: 38,
    image:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80",
    tag: "Groceries",
    href: "/product/daily-essentials-pack",
  },
  {
    id: 3,
    name: "Statement Pendant",
    description: "Minimal jewelry with maximum impact.",
    price: 129900,
    originalPrice: 149900,
    rating: 4.9,
    reviews: 120,
    image:
      "https://images.unsplash.com/photo-1518544801958-efcbf8a7ec10?w=600&q=80",
    tag: "Jewelry",
    href: "/product/statement-pendant",
  },
  {
    id: 4,
    name: "Smart Home Starter",
    description: "Connect your home with lights, plugs, and sensors.",
    price: 189900,
    rating: 4.5,
    reviews: 44,
    image:
      "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=600&q=80",
    tag: "Home",
    href: "/product/smart-home-starter",
  },
  {
    id: 5,
    name: "Wellness Gift Set",
    description: "Spa essentials, infused oils, candles, and more.",
    price: 55900,
    rating: 4.7,
    reviews: 53,
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
    tag: "Wellness",
    href: "/product/wellness-gift-set",
  },
  {
    id: 6,
    name: "Premium Coffee Kit",
    description: "Single-origin beans with grinder and accessories.",
    price: 99900,
    originalPrice: 119900,
    rating: 4.8,
    reviews: 88,
    image:
      "https://images.unsplash.com/photo-1422207134147-65fb81f59e38?w=600&q=80",
    tag: "Kitchen",
    href: "/product/premium-coffee-kit",
  },
];

export default function ProductListingPage() {
  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <ProductsCatalog products={featuredProducts} />
      </div>
    </section>
  );
}

