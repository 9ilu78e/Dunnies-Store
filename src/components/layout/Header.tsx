"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { getCurrentUser } from "@/services/auth";
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
} from "lucide-react";

type CurrentUser = {
  id: string;
  fullName: string;
  firstName?: string;
  email: string;
  phone?: string | null;
  role?: string;
};

type Category = {
  id: string;
  name: string;
};

const USER_INTERFACE_PATH = "/users-interface";
const ADMIN_DASHBOARD_PATH = "/dashboard";

const getProfileDestination = (user: CurrentUser | null) => {
  if (!user) return "/login";

  const normalizedRole = user.role?.toLowerCase();

  if (normalizedRole === "admin") {
    return ADMIN_DASHBOARD_PATH;
  }

  if (normalizedRole === "users" || normalizedRole === "user") {
    return USER_INTERFACE_PATH;
  }

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

  const userFirstName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    user?.email?.split("@")[0];
  const greetingName = userFirstName || "Guest";
  const profileHref = getProfileDestination(user);
  const avatarUrl = useMemo(() => {
    if (!user) return "";
    if (user.email) {
      return `https://unavatar.io/${encodeURIComponent(user.email)}`;
    }
    if (user.fullName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.fullName
      )}&background=8b5cf6&color=fff`;
    }
    return "";
  }, [user?.fullName, user?.email]);

  const wishlistCount = wishlistItems.length;

  const navItems = useMemo(
    () => [
      {
        label: "Home",
        href: "/",
        icon: <Home className="w-4 h-4 text-purple-500" />,
      },
      {
        label: "Products",
        href: "/product",
        icon: <Package className="w-4 h-4 text-purple-500" />,
      },
      {
        label: "Best Sellers",
        href: "/best-sellers",
        icon: <Flame className="w-4 h-4 text-purple-500" />,
      },
      {
        label: "Gifts",
        href: "/gift",
        icon: <Gift className="w-4 h-4 text-purple-700" />,
        children: giftCategories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
      },
      {
        label: "Groceries",
        href: "/groceries",
        icon: <ShoppingCart className="w-4 h-4 text-purple-700" />,
        children: groceryCategories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
      },
      {
        label: "Categories",
        href: "/categories",
        icon: <Package className="w-4 h-4 text-purple-700" />,
        children: categories.map((cat) => ({
          label: cat.name,
          href: `/product?category=${cat.id}`,
        })),
      },
      {
        label: "About",
        href: "/about",
        icon: <Info className="w-4 h-4 text-purple-700" />,
      },
      {
        label: "Help Center",
        href: "/help",
        icon: <HelpCircle className="w-4 h-4 text-purple-700" />,
      },
      {
        label: "Contact",
        href: "/contact",
        icon: <Phone className="w-4 h-4 text-purple-700" />,
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
      <div className="bg-linear-to-r from-purple-600 to-pink-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-1">
            <Globe className="w-3 h-3" />
            <span>Deliver Worldwide</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/track" className="hover:underline hidden sm:inline">
              Track Order
            </Link>
            <Link href="/help" className="hover:underline">
              Help
            </Link>
          </div>
        </div>
      </div>

      {isUserDropdownOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}

      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              href="/"
              className="flex items-center space-x-3 group shrink-0"
            >
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-gray-800 group-hover:text-purple-600 transition-colors">
                  Dunnis Stores
                </span>
                <p className="text-xs text-gray-500">Your one-stop shop</p>
              </div>
            </Link>

            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for gifts, groceries, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 rounded-full border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all duration-200 text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-1.5 rounded-full hover:shadow-lg transition-all duration-200 text-sm font-medium">
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <span className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-gray-50 group-hover:border-purple-200 overflow-hidden">
                    {user && avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={user.fullName}
                        width={44}
                        height={44}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-700 group-hover:text-purple-600" />
                    )}
                  </span>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs text-gray-500">
                      Hello {greetingName}
                    </p>
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-600">
                      Profile
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <div
                  className={`absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur rounded-2xl shadow-2xl py-3 border border-gray-100 transition-all duration-200 z-50 ${
                    isUserDropdownOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {user ? (
                    <>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        href={profileHref}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        Profile
                      </Link>
                      {user.role?.toLowerCase() === "admin" && (
                        <>
                          <hr className="my-2 border-gray-100" />
                          <Link
                            href="/manage-users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors font-medium"
                          >
                            Manage Users
                          </Link>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors font-medium"
                          >
                            Admin Dashboard
                          </Link>
                        </>
                      )}
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors font-medium"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors font-medium"
                      >
                        Sign Up
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        href={profileHref}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        Profile
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <Link
                href="/wishlist"
                className="relative p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    wishlistItems.length
                      ? "text-red-500 fill-red-500"
                      : "text-gray-700"
                  } group-hover:text-red-500 group-hover:fill-red-500 transition-all duration-200`}
                />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {totalItems}
                  </span>
                )}
              </Link>

              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
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
          <nav className="hidden lg:flex items-center space-x-1 pb-3 border-t border-gray-100 pt-3">
            {navItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="relative group">
                {item.children ? (
                  <>
                    <button className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200">
                      {item.icon}
                      <span>{item.label}</span>
                      <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2 border border-gray-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href || "#"}
                          className="block px-4 py-2.5 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors text-sm font-medium"
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
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
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
        <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-full ring-2 ring-purple-500 border border-gray-300 focus:border-purple-500 focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>
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

      <nav
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 lg:hidden bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 bg-linear-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={toggleMobileMenu} className="p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {user && avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.fullName}
                  width={48}
                  height={48}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>
            <div>
              <p className="font-semibold">Hello {greetingName}</p>
              {user ? (
                <div className="flex flex-col gap-2 mt-1 text-sm">
                  <Link
                    href={profileHref}
                    onClick={closeMobileMenu}
                    className="text-white font-medium bg-white/20 hover:bg-white/30 rounded-full px-4 py-1 transition"
                  >
                    Go to Profile
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      setShowLogoutModal(true);
                    }}
                    className="text-purple-100 hover:underline text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-3 text-sm">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-purple-100 hover:underline"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="text-purple-100 hover:underline"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {navItems.map((item, index) => (
            <div key={`mobile-${item.label}-${index}`}>
              {item.children ? (
                <>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium text-gray-700">
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
                          className="block px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
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
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  {item.icon}
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>
                </Link>
              )}
            </div>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
            <Link
              href="/wishlist"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <Heart
                className={`w-5 h-5 ${
                  wishlistCount ? "text-red-500 fill-red-500" : "text-gray-700"
                }`}
              />
              <span className="font-medium text-gray-700">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <Package className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-gray-700">My Orders</span>
            </Link>
          </div>
        </div>
      </nav>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}
