import Link from "next/link";
import {
  Building2,
  CalendarHeart,
  Globe2,
  Headphones,
  HelpCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import HeroSlider from "@/components/layout/HomeSlider";
import FeaturesBar from "@/components/layout/FeaturesBar";
import CategoriesGrid from "@/components/layout/CategoriesGrid";
import CategoryShowcase from "@/components/layout/CategoryShowcase";
import FeaturedProducts from "@/components/layout/FeaturedProducts";
import FeaturedGifts from "@/components/layout/FeaturedGifts";
import FeaturedGroceries from "@/components/layout/FeaturedGroceries";
import EcommerceHighlights from "@/components/layout/EcommerceHighlights";
import PromoBanners from "@/components/layout/PromoBanners";
import Testimonials from "@/components/layout/Testimonials";
import Newsletter from "@/components/layout/Newsletter";
import SpotlightCollections from "@/components/layout/SpotlightCollections";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <FeaturesBar />
      <CategoriesGrid />
      <CategoryShowcase />
      <FeaturedProducts />
      <FeaturedGifts />
      <FeaturedGroceries />
      <SpotlightCollections />
      <EcommerceHighlights />
      <PromoBanners />
      <Testimonials />
      <Newsletter />
    </>
  );
}
