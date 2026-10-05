export type SiteSettings = {
  storeName: string;
  headerSubtitle: string;
  headerLogo: string;
  headerTitleColor: string;
  headerSubtitleColor: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  heroSlides: HeroSlide[];
};

export type HeroSlide = {
  image: string;
  alt: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  tagTextColor: string;
  tagBackgroundColor: string;
  tagBackgroundOpacity: number;
  primaryButtonBackgroundColor: string;
  primaryButtonTextColor: string;
  secondaryButtonBackgroundColor: string;
  secondaryButtonBackgroundOpacity: number;
  secondaryButtonTextColor: string;
  secondaryButtonBorderColor: string;
  textAlignment: "left" | "center" | "right";
  contentPosition: "left" | "center" | "right";
  imageFit: "cover" | "contain";
  heroHeight: "compact" | "standard" | "tall";
  cornerRadius: "none" | "small" | "medium";
  overlayColor: string;
  overlayOpacity: number;
};

export const DEFAULT_HERO_SLIDE: Omit<HeroSlide, "image"> = {
  alt: "Dunnis Stores promotion",
  tag: "Welcome to Dunnis Stores",
  title: "Find something special",
  subtitle: "Thoughtful gifts, products, and souvenirs",
  description: "Explore our collection and discover something you will love.",
  ctaText: "Shop now",
  ctaHref: "/product",
  secondaryCtaText: "Shop all",
  secondaryCtaHref: "/product",
  titleColor: "#ffffff",
  subtitleColor: "#f5d0fe",
  descriptionColor: "#f3f4f6",
  tagTextColor: "#4c1d95",
  tagBackgroundColor: "#ffffff",
  tagBackgroundOpacity: 0.85,
  primaryButtonBackgroundColor: "#6d28d9",
  primaryButtonTextColor: "#ffffff",
  secondaryButtonBackgroundColor: "#ffffff",
  secondaryButtonBackgroundOpacity: 0.85,
  secondaryButtonTextColor: "#4c1d95",
  secondaryButtonBorderColor: "#6d28d9",
  textAlignment: "left",
  contentPosition: "left",
  imageFit: "cover",
  heroHeight: "standard",
  cornerRadius: "small",
  overlayColor: "#000000",
  overlayOpacity: 0,
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  storeName: "Dunnis Stores",
  headerSubtitle: "Premium Shopping",
  headerLogo: "",
  headerTitleColor: "#7c3aed",
  headerSubtitleColor: "#6b7280",
  supportEmail: "support@dunnistores.ng",
  supportPhone: "+234 901 987 6543",
  address: "Garki, Abuja, Nigeria",
  heroSlides: [],
};
