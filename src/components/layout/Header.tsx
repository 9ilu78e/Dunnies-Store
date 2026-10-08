"use client";

import {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { getCurrentUser } from "@/services/authService";
import { getCategories } from "@/lib/categoryClient";
import LogoutModal from "./LogoutModal";
import UserAvatar from "@/components/ui/UserAvatar";
import NotificationBell from "@/components/notification/NotificationBell";
import { useSiteSettings } from "./SiteSettingsProvider";
import {
  Menu,
  X,
  User,
  UserRound,
  Heart,
  ChevronDown,
  ChevronRight,
  Gift,
  ShoppingCart,
  ShoppingBag,
  Package,
  Landmark,
  Home,
  Info,
  Phone,
  Mail,
  MessageCircle,
  MessageSquareText,
  Headset,
  ClipboardList,
  Search,
  Bell,
  Globe,
  HelpCircle,
  Flame,
  Tags,
  BadgePercent,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useWishlistContext } from "@/context/WishlistContext";
import { getHelpLinks } from "@/lib/helpLinks";

type CurrentUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type Category = {
  id: string;
  name: string;
};

type NavigationChild = {
  label: string;
  href: string;
  external?: boolean;
  icon?: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
  children?: NavigationChild[];
};

const USER_INTERFACE_PATH = "/users-interface";
const ADMIN_DASHBOARD_PATH = "/dashboard";

const getProfileDestination = (user: CurrentUser | null) => {
  if (!user) return "/login";

  // For Firebase users, default to user interface
  return USER_INTERFACE_PATH;
};

const getHelpOptionIcon = (label: string): ReactNode => {
  const className = "h-4 w-4";
  switch (label) {
    case "All Help":
      return <HelpCircle className={className} />;
    case "Visit Shop":
      return <Home className={className} />;
    case "Live Chat":
      return <Headset className={className} />;
    case "WhatsApp":
      return <MessageCircle className={className} />;
    case "Email":
      return <Mail className={className} />;
    case "Call Support":
      return <Phone className={className} />;
    case "Contact Form":
      return <MessageSquareText className={className} />;
    case "FAQs":
      return <Info className={className} />;
    case "Track Order":
      return <Package className={className} />;
    case "My Orders":
      return <ClipboardList className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

export default function Header() {
  const {
    storeName,
    headerSubtitle,
    headerLogo,
    headerTitleColor,
    headerSubtitleColor,
    supportEmail,
    supportPhone,
  } = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [giftCategories, setGiftCategories] = useState<Category[]>([]);
  const [souvenirCategories, setSouvenirCategories] = useState<Category[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helpDropdownRef = useRef<HTMLDivElement>(null);
  const [helpDropdownWidth, setHelpDropdownWidth] = useState(480);

  const positionHelpDropdown = useCallback(() => {
    const dropdownAnchor = helpDropdownRef.current;
    if (!dropdownAnchor) return;

    const anchor = dropdownAnchor.getBoundingClientRect();
    const center = anchor.left + anchor.width / 2;
    const availableHalfWidth = Math.max(
      0,
      Math.min(center - 8, window.innerWidth - center - 8)
    );
    setHelpDropdownWidth(Math.min(352, availableHalfWidth * 2));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", positionHelpDropdown);
    return () => window.removeEventListener("resize", positionHelpDropdown);
  }, [positionHelpDropdown]);

  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlistContext();
  const wishlistCount = wishlistItems.length;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const query = searchQuery.trim();
    router.replace(
      query ? `/product?search=${encodeURIComponent(query)}` : "/product"
    );
    setIsMobileMenuOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      const query = value.trim();
      const destination = query
        ? `/product?search=${encodeURIComponent(query)}`
        : "/product";
      router.replace(destination);
      setIsMobileMenuOpen(false);
    }, 250);
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (isSubscribed) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isSubscribed) {
          setUser(null);
        }
      }
    };

    fetchUser();

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  useEffect(() => {
    let isSubscribed = true;

    void Promise.all([
      getCategories("product"),
      getCategories("gift"),
      getCategories("souvenir"),
    ])
      .then(([products, gifts, souvenirs]) => {
        if (!isSubscribed) return;
        setCategories(products);
        setGiftCategories(gifts);
        setSouvenirCategories(souvenirs);
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch categories:", error);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const greetingName = useMemo(() => {
    if (!user) return "Guest";
    return user.displayName || user.email?.split("@")[0] || "User";
  }, [user]);
  const profileHref = getProfileDestination(user);

  const navItems = useMemo<NavigationItem[]>(
    () => [
      {
        label: "Home",
        href: "/",
        icon: <Home className="w-4 h-4" />,
      },
      {
        label: "Products",
        href: "/product",
        icon: <ShoppingBag className="w-4 h-4" />,
        children: [
          {
            label: "All Products",
            href: "/product",
            icon: <Package className="h-4 w-4" />,
          },
          {
            label: "Shop by Category",
            href: "/categories",
            icon: <Tags className="h-4 w-4" />,
          },
          {
            label: "Best Sellers",
            href: "/best-sellers",
            icon: <Flame className="h-4 w-4" />,
          },
          {
            label: "Flash Sales",
            href: "/flash-sales",
            icon: <BadgePercent className="h-4 w-4" />,
          },
        ],
      },
      {
        label: "Best Sellers",
        href: "/best-sellers",
        icon: <Flame className="w-4 h-4" />,
      },
      {
        label: "Gifts",
        href: "/gift",
        icon: <Gift className="w-4 h-4" />,
        children: [
          {
            label: "All Gifts",
            href: "/gift",
            icon: <Gift className="h-4 w-4" />,
          },
          ...giftCategories.map((cat) => ({
            label: cat.name,
            href: `/product?category=${cat.id}`,
            icon: <Gift className="h-4 w-4" />,
          })),
        ],
      },
      {
        label: "Souvenirs",
        href: "/souvenirs",
        icon: <Landmark className="w-4 h-4" />,
        children: [
          {
            label: "All Souvenirs",
            href: "/souvenirs",
            icon: <Landmark className="h-4 w-4" />,
          },
          ...souvenirCategories.map((cat) => ({
            label: cat.name,
            href: `/product?category=${cat.id}`,
            icon: <Landmark className="h-4 w-4" />,
          })),
        ],
      },
      {
        label: "Categories",
        href: "/categories",
        icon: <Package className="w-4 h-4" />,
        children: [
          {
            label: "All Categories",
            href: "/categories",
            icon: <Tags className="h-4 w-4" />,
          },
          ...categories.map((cat) => ({
            label: cat.name,
            href: `/product?category=${cat.id}`,
            icon: <Package className="h-4 w-4" />,
          })),
        ],
      },
      {
        label: "About",
        href: "/about",
        icon: <Info className="w-4 h-4" />,
      },
      {
        label: "Help Center",
        href: "/help",
        icon: <HelpCircle className="w-4 h-4" />,
        children: getHelpLinks({
          supportEmail,
          supportPhone,
          whatsappNumber:
            process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || supportPhone,
        }).map((child) => ({
          ...child,
          icon: getHelpOptionIcon(child.label),
        })),
      },
      {
        label: "Contact",
        href: "/contact",
        icon: <Phone className="w-4 h-4" />,
      },
    ],
    [categories, giftCategories, souvenirCategories, supportEmail, supportPhone]
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) setOpenDropdown(null);
    setIsUserDropdownOpen(false);
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">Free Worldwide Delivery</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/track"
              className="hover:underline hidden sm:inline font-medium"
            >
              Track Order
            </Link>
            <Link href="/help" className="hover:underline font-medium">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {isUserDropdownOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Enhanced Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 group shrink-0"
            >
              <div className="relative">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 transform group-hover:scale-105 transition-all duration-300">
                  {headerLogo ? (
                    <Image
                      src={headerLogo}
                      alt={`${storeName} logo`}
                      fill
                      sizes="44px"
                      className="rounded-xl object-cover"
                    />
                  ) : (
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                  <Sparkles className="w-2.5 h-2.5 text-yellow-300 absolute -top-0.5 -right-0.5 animate-pulse" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <span
                  style={
                    headerTitleColor.toLowerCase() === "#7c3aed"
                      ? undefined
                      : { color: headerTitleColor }
                  }
                  className={`font-bold text-base md:text-lg transition-all duration-300 ${
                    headerTitleColor.toLowerCase() === "#7c3aed"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600"
                      : ""
                  }`}
                >
                  {storeName}
                </span>
                <p
                  className="text-[10px] font-medium -mt-0.5"
                  style={{ color: headerSubtitleColor }}
                >
                  {headerSubtitle}
                </p>
              </div>
            </Link>

            {/* Enhanced Search Box */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form className="relative w-full group" onSubmit={submitSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for gifts, souvenirs, and more..."
                    aria-label="Search products, gifts, and souvenirs"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-full border-2 border-gray-200 py-2 pl-10 pr-4 text-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
              </form>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {user && (
                <div className="lg:hidden">
                  <NotificationBell
                    role="user"
                    onUnreadCountChange={setUnreadNotificationCount}
                  />
                </div>
              )}
              {user && (
                <div className="hidden lg:block">
                  <NotificationBell
                    role="user"
                    onUnreadCountChange={setUnreadNotificationCount}
                  />
                </div>
              )}
              {/* Enhanced Profile Dropdown */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group border border-transparent hover:border-purple-200"
                >
                  <div className="relative">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:border-purple-400 overflow-hidden transition-all duration-200 group-hover:scale-105">
                      {user ? (
                        <UserAvatar
                          src={user.photoURL}
                          alt={user.displayName || user.email || "User"}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-purple-600" />
                      )}
                    </span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                      My Account
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Hello, {greetingName}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 group-hover:text-purple-600 transition-all duration-300 ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Enhanced Dropdown Menu */}
                <div
                  className={`absolute right-0 z-[90] mt-2 w-72 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl shadow-violet-950/10 ring-1 ring-black/5 transition-all duration-200 ${
                    isUserDropdownOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* Dropdown Content */}
                  <div className="p-2">
                    {user ? (
                      <>
                        <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
                            {user.photoURL ? (
                              <UserAvatar
                                src={user.photoURL}
                                alt={user.displayName || user.email || "User"}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <UserRound className="h-5 w-5 text-violet-600" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                              Signed in
                            </p>
                            <p className="truncate text-sm font-bold text-gray-900">
                              {greetingName}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={profileHref}
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="font-medium text-sm">My Profile</p>
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm">My Orders</p>
                        </Link>
                        <Link
                          href="/notifications"
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Bell className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <p className="font-medium text-sm">Notifications</p>
                          {unreadNotificationCount > 0 && (
                            <span
                              aria-label={`${unreadNotificationCount} unread notifications`}
                              className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white"
                            >
                              {unreadNotificationCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                            <Heart className="w-3.5 h-3.5 text-pink-600" />
                          </div>
                          <p className="font-medium text-sm">Wishlist</p>
                          {wishlistCount > 0 && (
                            <span
                              aria-label={`${wishlistCount} wishlist items`}
                              className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white"
                            >
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                        <hr className="my-1.5 border-gray-100" />
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-red-600 transition-all group hover:bg-red-50"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-3.5 h-3.5 text-red-600" />
                          </div>
                          <p className="font-medium text-sm">Logout</p>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-center px-2 py-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-12 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              router.push("/login");
                            }}
                          >
                            <UserRound className="h-4 w-4" aria-hidden="true" />
                            Login
                          </button>
                        </div>
                        <hr className="my-1.5 border-gray-100" />
                        <Link
                          href="/orders"
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm">My Orders</p>
                        </Link>
                        <Link
                          href={profileHref}
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-gray-700 transition-all group hover:bg-violet-50 hover:text-violet-700"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="font-medium text-sm">Profile</p>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/*
 Cart Icon */}              <Link
                href="/cart"
                aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
                className="relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-purple-600 transition-all duration-200 group-hover:scale-110" />
                <span className="ml-0 text-[15px] font-semibold text-gray-700 group-hover:text-purple-600 lg:ml-3">
                  Cart
                </span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 left-6 min-w-5 h-5 px-1 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="relative hidden w-full items-center justify-center space-x-2 border-t border-gray-100 pb-3 pt-3 lg:flex">
            {navItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="group relative"
                ref={
                  item.label === "Help Center" ? helpDropdownRef : undefined
                }
                onMouseEnter={
                  item.label === "Help Center"
                    ? positionHelpDropdown
                    : undefined
                }
              >
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-haspopup="true"
                      className="group flex items-center space-x-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-violet-100 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                    </button>
                    <div
                      style={
                        item.label === "Help Center"
                          ? {
                              width: `${helpDropdownWidth}px`,
                            }
                          : undefined
                      }
                      className={`invisible absolute z-50 mt-0 max-w-[calc(100vw-1rem)] translate-y-1 rounded-[2px] border border-violet-100 bg-white p-2 opacity-0 shadow-2xl shadow-violet-950/10 ring-1 ring-black/5 transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
                        item.label === "Help Center"
                          ? "left-1/2 -translate-x-1/2"
                          : "left-0 w-[min(calc(100vw-1rem),28rem)]"
                      }`}
                    >
                      {item.label === "Help Center" && (
                        <div className="mb-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 p-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              How can we help?
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Choose a support option.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1.5">
                        {item.children.map((child) =>
                        child.external ? (
                          <a
                            key={child.label}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-all hover:bg-violet-50 hover:text-violet-700"
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </a>
                        ) : child.href.startsWith("mailto:") ||
                          child.href.startsWith("tel:") ? (
                          <a
                            key={child.label}
                            href={child.href}
                            className="group flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-all hover:bg-violet-50 hover:text-violet-700"
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </a>
                        ) : (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="group flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition-all hover:bg-violet-50 hover:text-violet-700"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </Link>
                        )
                      )}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 text-sm font-medium hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all duration-200"
                    onClick={() => setOpenDropdown(null)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3">
          <form className="relative" onSubmit={submitSearch}>
            <input
              type="text"
              placeholder="Search products, gifts, and souvenirs..."
              aria-label="Search products, gifts, and souvenirs"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-full border-2 border-purple-200 py-2.5 pl-11 pr-4 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          </form>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      {/* Mobile Menu */}
      <nav
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-[60] lg:hidden bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={toggleMobileMenu}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-sm border-2 border-white/30">
              {user ? (
                <UserAvatar
                  src={user.photoURL}
                  alt={user.displayName || user.email || "User"}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-base">Your account</p>
              {user ? (
                <div className="flex flex-col gap-2 mt-2 text-sm">
                  <Link
                    href={profileHref}
                    onClick={closeMobileMenu}
                    className="text-white font-medium bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 transition inline-block text-center backdrop-blur-sm"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      setShowLogoutModal(true);
                    }}
                    className="text-purple-100 hover:text-white transition text-left text-xs"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-3 mt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      router.push("/login");
                    }}
                  className="px-1 py-1 font-medium text-white transition hover:text-purple-100"
                  >
                   <span className="inline-flex items-center gap-2">
                     <UserRound className="h-4 w-4" aria-hidden="true" />
                     Login
                   </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <div className="space-y-2 px-3 py-3">
          {navItems.map((item, index) => (
            <div key={`mobile-${item.label}-${index}`}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    aria-expanded={openDropdown === item.label}
                    onClick={() => handleDropdownToggle(item.label)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-100"
                  >
                    <span className="flex items-center space-x-3">
                      {item.icon && (
                        <span className="flex h-7 w-8 items-center justify-center text-purple-600">
                          {item.icon}
                        </span>
                      )}
                      <span className="font-semibold text-gray-700">
                        {item.label}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                        openDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openDropdown === item.label
                        ? "max-h-[min(60vh,32rem)] overflow-y-auto"
                        : "max-h-0"
                    }`}
                  >
                    <div className="flex flex-col overflow-hidden rounded-[2px]">
                      {item.children.map((child) =>
                        child.external ? (
                          <a
                            key={child.label}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-h-11 min-w-0 items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-violet-700"
                            onClick={closeMobileMenu}
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </a>
                        ) : child.href.startsWith("mailto:") ||
                          child.href.startsWith("tel:") ? (
                          <a
                            key={child.label}
                            href={child.href}
                            className="group flex min-h-11 min-w-0 items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-violet-700"
                            onClick={closeMobileMenu}
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </a>
                        ) : (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="group flex min-h-11 min-w-0 items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-violet-700"
                            onClick={closeMobileMenu}
                          >
                            {item.label === "Help Center" && child.icon && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                {child.icon || item.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">{child.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href || "#"}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  {item.icon && (
                    <span className="flex h-7 w-8 items-center justify-center text-purple-600">
                      {item.icon}
                    </span>
                  )}
                  <span className="font-semibold text-gray-700">
                    {item.label}
                  </span>
                </Link>
              )}
            </div>
          ))}

          {/* Additional Links */}
          <div className="pt-1 mt-1 border-t border-gray-200 space-y-1">
            <Link
              href="/wishlist"
              className="flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <span className="flex h-7 w-8 items-center justify-center text-red-600">
                <Heart className="w-4 h-4" />
              </span>
              <span className="font-semibold text-gray-700">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <span className="flex h-7 w-8 items-center justify-center text-blue-600">
                <Package className="w-4 h-4" />
              </span>
              <span className="font-semibold text-gray-700">My Orders</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLoggedOut={() => {
          setUser(null);
          setIsUserDropdownOpen(false);
          setIsMobileMenuOpen(false);
        }}
      />
    </>
  );
}
