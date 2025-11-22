"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Tags,
  Settings,
  User,
  BarChart3,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/manage-products",
    icon: Package,
  },
  {
    label: "Product Analytics",
    href: "/product-analytics",
    icon: BarChart3,
  },
  {
    label: "Gifts",
    href: "/manage-gifts",
    icon: Package,
  },
  {
    label: "Groceries",
    href: "/manage-groceries",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/manage-orders",
    icon: ClipboardList,
  },
  {
    label: "Categories",
    href: "/manage-categories",
    icon: Tags,
  },
  {
    label: "Users",
    href: "/manage-users",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin-settings",
    icon: Settings,
  },
];

type SidebarUser = {
  fullName?: string;
  email?: string;
} | null;

interface SidebarProps {
  user: SidebarUser;
  onNavClick?: () => void;
}

export default function Sidebar({ user, onNavClick }: SidebarProps) {
  const pathname = usePathname();

  const avatarUrl = useMemo(() => {
    if (!user) return "";
    if (user.email) {
      return `https://unavatar.io/${encodeURIComponent(user.email)}`;
    }
    if (user.fullName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.fullName
      )}&background=0f172a&color=fff`;
    }
    return "";
  }, [user]);

  return (
    <aside className="h-full w-72 bg-linear-to-b from-purple-950 via-purple-900 to-purple-800 text-white flex flex-col border-r border-purple-950">
      <div className="px-6 py-6 border-b border-white/10 space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-purple-300">
          Dunnis Admin
        </p>
        <h1 className="text-2xl font-bold">Control Center</h1>

        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 shadow-inner">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user?.fullName || "Admin avatar"}
                width={48}
                height={48}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="text-white">
            <p className="text-sm text-purple-200">Signed in as</p>
            <p className="font-semibold leading-tight">
              {user?.fullName || "Admin"}
            </p>
            <p className="text-xs text-purple-200 truncate max-w-44">
              {user?.email || "admin@dunnis.store"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                isActive
                  ? "bg-white/15 text-white shadow-lg shadow-purple-900/30"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-6 border-t border-white/10 text-xs text-purple-200">
        © {new Date().getFullYear()} Dunnis Stores
      </div>
    </aside>
  );
}
