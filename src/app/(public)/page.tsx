import HeroSlider from "@/components/layout/HomeSlider";
import CategoriesGrid from "@/components/layout/CategoriesGrid";
import FlashSalesProducts from "@/components/product/FlashSalesProducts";
import CategoryShowcase from "@/components/layout/CategoryShowcase";
import FeaturedProducts from "@/components/layout/FeaturedProducts";
import FeaturedGifts from "@/components/layout/FeaturedGifts";
import FeaturedSouvenirs from "@/components/layout/FeaturedSouvenirs";
import EcommerceHighlights from "@/components/layout/EcommerceHighlights";
import PromoBanners from "@/components/layout/PromoBanners";
import Testimonials from "@/components/layout/Testimonials";
import Newsletter from "@/components/layout/Newsletter";
import SpotlightCollections from "@/components/layout/SpotlightCollections";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <CategoriesGrid type="product" />
      <section className="px-3 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-gray-100 bg-white p-3 sm:p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl">
                <Flame className="h-5 w-5 text-amber-500" />
                Flash Sales
              </h2>
              <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                Limited-time prices on selected products
              </p>
            </div>
            <Link
              href="/flash-sales"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm transition hover:bg-purple-100"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <FlashSalesProducts limit={4} compact />
        </div>
      </section>
      <FeaturedProducts />
      <CategoriesGrid type="gift" />
      <FeaturedGifts />
      <CategoryShowcase />
      <CategoriesGrid type="souvenir" />
      <FeaturedSouvenirs />
      <SpotlightCollections />
      <EcommerceHighlights />
      <PromoBanners />
      <Testimonials />
      <Newsletter />
    </>
  );
}
