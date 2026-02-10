"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { getCurrentUser } from "@/services/authService";
import { useWishlist } from "@/hooks/useWishlist";
import LogoutModal from "./LogoutModal";
import {
  Menu,
  X,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
  Gift,
  ShoppingCart,
  Package,
  Home,
  Info,
  Phone,
  Search,
  Globe,
  HelpCircle,
  Flame,
  Sparkles,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";

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

const USER_INTERFACE_PATH = "/users-interface";
const ADMIN_DASHBOARD_PATH = "/dashboard";

const getProfileDestination = (user: CurrentUser | null) => {
  if (!user) return "/login";

  // For Firebase users, default to user interface
  return USER_INTERFACE_PATH;
};

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [giftCategories, setGiftCategories] = useState<Category[]>([]);
  const [groceryCategories, setGroceryCategories] = useState<Category[]>([]);
  const pathname = usePathname();
  const { items: wishlistItems } = useWishlist();

  const { totalItems } = useCart();

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

    const fetchCategories = async () => {
      try {
        const productRes = await fetch(
          `/api/categories?type=product&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        if (productRes.ok && isSubscribed) {
          const data = await productRes.json();
          setCategories(data.categories || []);
        }

        const giftRes = await fetch(
          `/api/categories?type=gift&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        if (giftRes.ok && isSubscribed) {
          const data = await giftRes.json();
          setGiftCategories(data.categories || []);
        }

        const groceryRes = await fetch(
          `/api/categories?type=grocery&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        if (groceryRes.ok && isSubscribed) {
          const data = await groceryRes.json();
          setGroceryCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();

    const interval = setInterval(fetchCategories, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const greetingName = useMemo(() => {
    if (!user) return "Guest";
    return user.displayName || user.email?.split("@")[0] || "User";
  }, [user]);
  const profileHref = getProfileDestination(user);
  const avatarUrl = useMemo(() => {
    if (!user) return "";
    if (user.photoURL) {
      return user.photoURL;
    }
    if (user.email) {
      return `https://unavatar.io/${encodeURIComponent(user.email)}`;
    }
    if (user.displayName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.displayName
      )}&background=8b5cf6&color=fff`;
    }
    return "";
  }, [user?.displayName, user?.email, user?.photoURL]);

  const wishlistCount = wishlistItems.length;

  const navItems = useMemo(
    () => [
      {
        label: "Home",
        href: "/",
        icon: <Home className="w-4 h-4" />,
      },
      {
        label: "Products",
        href: "/product",
        icon: <Package className="w-4 h-4" />,
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
        children: giftCategories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
      },
      {
        label: "Groceries",
        href: "/groceries",
        icon: <ShoppingCart className="w-4 h-4" />,
        children: groceryCategories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
      },
      {
        label: "Categories",
        href: "/categories",
        icon: <Package className="w-4 h-4" />,
        children: categories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
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
      },
      {
        label: "Contact",
        href: "/contact",
        icon: <Phone className="w-4 h-4" />,
      },
    ],
    [categories, giftCategories, groceryCategories]
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
            <Link href="/track" className="hover:underline hidden sm:inline font-medium">
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
          className="hidden lg:block fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Enhanced Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 group shrink-0"
            >
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 transform group-hover:scale-105 transition-all duration-300">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  <Sparkles className="w-2.5 h-2.5 text-yellow-300 absolute -top-0.5 -right-0.5 animate-pulse" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-base md:text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 transition-all duration-300">
                  Dunnis Stores
                </span>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">
                  Premium Shopping
                </p>
              </div>
            </Link>

            {/* Enhanced Search Box */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full group">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for gifts, groceries, and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-28 rounded-full border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all duration-200 text-sm"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-1.5 rounded-full hover:shadow-md hover:scale-105 transition-all duration-200 text-xs font-semibold flex items-center space-x-1">
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Enhanced Profile Dropdown */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group border border-transparent hover:border-purple-200"
                >
                  <div className="relative">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:border-purple-400 overflow-hidden transition-all duration-200 group-hover:scale-105">
                      {user && avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={user.displayName || "User"}
                          width={36}
                          height={36}
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-4 h-4 text-purple-600" />
                      )}
                    </span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-[10px] text-gray-500 font-medium">
                      Hello, {greetingName}
                    </p>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                      My Account
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover:text-purple-600 transition-all duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Enhanced Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-300 z-50 overflow-hidden ${
                    isUserDropdownOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* Dropdown Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2.5 text-white">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center overflow-hidden">
                        {user && avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={user.displayName || "User"}
                            width={36}
                            height={36}
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs truncate">Hello, {greetingName}!</p>
                        {user?.email && (
                          <p className="text-[10px] text-purple-100 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Content */}
                  <div className="py-1.5">
                    {user ? (
                      <>
                        <Link
                          href={profileHref}
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="font-medium text-sm">My Profile</p>
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm">My Orders</p>
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                            <Heart className="w-3.5 h-3.5 text-pink-600" />
                          </div>
                          <p className="font-medium text-sm">Wishlist</p>
                        </Link>
                        <hr className="my-1.5 border-gray-100" />
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-all group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-3.5 h-3.5 text-red-600" />
                          </div>
                          <p className="font-medium text-sm">Logout</p>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="font-medium text-sm">Login</p>
                        </Link>
                        <hr className="my-1.5 border-gray-100" />
                        <Link
                          href="/orders"
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm">My Orders</p>
                        </Link>
                        <Link
                          href={profileHref}
                          className="flex items-center space-x-2.5 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all group"
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

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="relative p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 group"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    wishlistItems.length
                      ? "text-red-500 fill-red-500"
                      : "text-gray-700"
                  } group-hover:text-red-500 group-hover:fill-red-500 transition-all duration-200 group-hover:scale-110`}
                />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                href="/cart"
                className="relative p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-purple-600 transition-all duration-200 group-hover:scale-110" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
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
          <nav className="hidden lg:flex items-center space-x-1 pb-3 border-t border-gray-100 pt-3">
            {navItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="relative group">
                {item.children ? (
                  <>
                    <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-gray-700 text-xs font-medium hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all duration-200">
                      {item.icon}
                      <span>{item.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-1.5 border border-gray-100 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href || "#"}
                          className="block px-3 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all text-xs font-medium"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-gray-700 text-xs font-medium hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all duration-200"
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
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-11 pr-4 rounded-full border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 text-sm shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
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
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 lg:hidden bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={toggleMobileMenu} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-sm border-2 border-white/30">
              {user && avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.displayName || "User"}
                  width={48}
                  height={48}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-base">Hello, {greetingName}!</p>
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
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-white font-medium bg-white/20 hover:bg-white/30 rounded-full px-4 py-1 transition backdrop-blur-sm"
                  >
                    Login
                  </Link>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <div className="p-4 space-y-2">
          {navItems.map((item, index) => (
            <div key={`mobile-${item.label}-${index}`}>
              {item.children ? (
                <>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                  >
                    <span className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                        {item.icon}
                      </span>
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
                      openDropdown === item.label ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="pl-12 space-y-1 py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href || "#"}
                          className="block px-4 py-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                          onClick={closeMobileMenu}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href || "#"}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    {item.icon}
                  </span>
                  <span className="font-semibold text-gray-700">
                    {item.label}
                  </span>
                </Link>
              )}
            </div>
          ))}

          {/* Additional Links */}
          <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
            <Link
              href="/wishlist"
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Heart
                    className={`w-4 h-4 ${
                      wishlistCount ? "text-red-500 fill-red-500" : "text-red-600"
                    }`}
                  />
                </span>
                <span className="font-semibold text-gray-700">Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
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
      />
    </>
  );
}

