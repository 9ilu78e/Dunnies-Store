export type SiteSettings = {
  storeName: string;
  headerSubtitle: string;
  headerLogo: string;
  headerTitleColor: string;
  headerSubtitleColor: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  heroImages: string[];
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
  heroImages: [
    "/assets/WhatsApp Image 2026-10-03 at 04.09.47.jpeg",
    "/assets/WhatsApp Image 2026-10-03 at 04.09.48.jpeg",
    "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (1).jpeg",
    "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (2).jpeg",
    "/assets/WhatsApp Image 2026-10-03 at 04.09.48 (3).jpeg",
    "/assets/WhatsApp Image 2026-10-03 at 04.09.49.jpeg",
  ],
};
