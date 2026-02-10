"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import ProductCategoriesGrid from "@/components/layout/ProductCategoriesGrid";
import { getCurrentUser } from "@/services/authService";
import {
  ShoppingBag,
  Heart,
  CreditCard,
  MapPin,
  Settings,
  MessageCircle,
  Truck,
  ShieldCheck,
  Store,
  Gift,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type CurrentUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

const getAvatarUrl = (photoURL?: string | null, displayName?: string | null, email?: string | null) => {
  // Use Firebase photoURL if available
  if (photoURL) {
    return photoURL;
  }
  
  // Fallback to other services
  if (email) {
    return `https://unavatar.io/${encodeURIComponent(email)}`;
  }

  if (displayName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=8b5cf6&color=fff`;
  }

  return "https://ui-avatars.com/api/?name=Dunnis+Stores&background=8b5cf6&color=fff";
};

const essentialLinks = [
  {
    title: "Orders",
    description: "Track deliveries and see what’s on the way.",
    href: "/orders",
    icon: ShoppingBag,
    accent: "text-purple-600 bg-purple-100",
  },
  {
    title: "Wishlist",
    description: "Revisit items you loved and save new picks.",
    href: "/wishlist",
    icon: Heart,
    accent: "text-pink-600 bg-pink-100",
  },
  {
    title: "Payment Methods",
    description: "Manage cards and preferred checkout options.",
    href: "/payment-methods",
    icon: CreditCard,
    accent: "text-green-600 bg-green-100",
  },
  {
    title: "Addresses",
    description: "Save home, office, and gift delivery spots.",
    href: "/addresses",
    icon: MapPin,
    accent: "text-blue-600 bg-blue-100",
  },
  {
    title: "Settings",
    description: "Profile info, passwords, and notification prefs.",
    href: "/settings",
    icon: Settings,
    accent: "text-slate-700 bg-slate-100",
  },
];

const supportCards = [
  {
    title: "Order Support",
    description: "Need help with an order? Chat with us.",
    href: "/contact",
    icon: MessageCircle,
    accent: "text-indigo-600 bg-indigo-100",
  },
  {
    title: "Delivery Updates",
    description: "View timelines and shipping guarantees.",
    href: "/orders",
    icon: Truck,
    accent: "text-amber-600 bg-amber-100",
  },
  {
    title: "Account Security",
    description: "Update passwords and two-factor options.",
    href: "/settings",
    icon: ShieldCheck,
    accent: "text-slate-600 bg-slate-100",
  },
];

const giftIdeas = [
  {
    title: "Birthday Bundles",
    blurb: "Fresh picks for celebrations happening right now.",
    href: "/gifts/birthday",
    tag: "Trending",
  },
  {
    title: "Corporate Gifts",
    blurb: "Curated sets that impress clients and teams.",
    href: "/gifts/corporate",
    tag: "Bestseller",
  },
  {
    title: "Home & Living",
    blurb: "Statement decor and cozy essentials.",
    href: "/categories/decor",
    tag: "New drop",
  },
];

export default function UsersInterfacePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyUser = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();

        if (!isMounted) return;

        if (!currentUser) {
          router.replace("/login?from=users-interface");
          return;
        }

        setUser(currentUser);
      } catch (error) {
        if (isMounted) {
          router.replace("/login?from=users-interface");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const greetingName = useMemo(() => {
    if (!user) return "Guest";
    return user.displayName || user.email || "User";
  }, [user]);

  const avatarUrl = useMemo(() => {
    return getAvatarUrl(user?.photoURL, user?.displayName, user?.email);
  }, [user?.photoURL, user?.displayName, user?.email]);

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <Loader text="Loading your space…" />
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="bg-linear-to-b from-purple-50 via-white to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="rounded-2xl sm:rounded-3xl bg-linear-to-r from-purple-700 via-purple-600 to-fuchsia-600 p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 border-white/30 overflow-hidden shadow-lg">
                  <Image
                    src={avatarUrl}
                    alt={`${greetingName} avatar`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <Link
                  href="/settings"
                  className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg hover:bg-purple-50 transition"
                  title="Account settings"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
                  Hello {greetingName}!
                </h1>
                <p className="text-xs sm:text-sm text-purple-100 max-w-2xl line-clamp-3">
                  Access orders, wishlist, payment details, and continue
                  shopping.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              <Link
                href="/product"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 sm:px-6 py-2 sm:py-3 text-white text-sm sm:text-base font-semibold hover:bg-white/25 transition"
              >
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Shop</span>
              </Link>
              <Link
                href="/gifts"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-purple-600 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base hover:bg-purple-50 transition"
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Gifts</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {essentialLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl sm:rounded-2xl bg-white border border-purple-100 p-4 sm:p-5 shadow-sm hover:shadow-lg transition flex items-start gap-3 sm:gap-4"
            >
              <span
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${item.accent}`}
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {supportCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl sm:rounded-2xl bg-white border border-purple-100 p-4 sm:p-5 shadow-sm hover:shadow-lg transition flex items-start gap-3"
            >
              <span
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${card.accent}`}
              >
                <card.icon className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {card.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl sm:rounded-3xl bg-white border border-purple-100 p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-purple-600 font-semibold mb-1">
                Continue Shopping
              </p>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">
                Ideas for you
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Explore more items while managing your account.
              </p>
            </div>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 text-purple-600 text-sm sm:text-base font-semibold hover:text-purple-700 whitespace-nowrap"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {giftIdeas.map((idea) => (
              <Link
                key={idea.title}
                href={idea.href}
                className="rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 hover:border-purple-200 hover:shadow-md transition bg-linear-to-br from-white to-purple-50/30"
              >
                <p className="inline-flex items-center text-xs font-semibold text-purple-600 bg-purple-100/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full mb-2">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {idea.tag}
                </p>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                  {idea.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                  {idea.blurb}
                </p>
                <span className="inline-flex items-center text-xs sm:text-sm font-semibold text-purple-600">
                  Shop
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <ProductCategoriesGrid />
      </div>
    </section>
  );
}
