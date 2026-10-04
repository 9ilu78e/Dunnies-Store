"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Tags,
  Settings,
  User,
  BarChart3,
  BadgePercent,
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
    label: "Flash Sales",
    href: "/manage-flash-sales",
    icon: BadgePercent,
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
    label: "Souvenirs",
    href: "/manage-souvenirs",
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
  photoURL?: string;
} | null;

interface SidebarProps {
  user: SidebarUser;
  onNavClick?: () => void;
}

export default function Sidebar({ user, onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-72 bg-linear-to-b from-purple-950 via-purple-900 to-purple-800 text-white flex flex-col border-r border-purple-950">
      <div className="px-6 py-6 border-b border-white/10 space-y-4">
        <p className="text-[20px] uppercase tracking-[0.15em] text-purple-300 font-bold">
          Dunnis Admin
        </p>

        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 shadow-inner">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            {user ? (
              <UserAvatar
                src={user.photoURL}
                alt={user.fullName || user.email || "Admin"}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div className="text-white min-w-0">
            <p className="text-[15px] text-purple-200">Signed in as</p>
            <p className="font-semibold text-xs leading-tight truncate">
              {user?.fullName || "Admin"}
            </p>
            <p className="text-[13px] text-purple-200 truncate">
              {user?.email || "admin@dunnis.store"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 md:space-y-2 md:px-4 md:py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition md:gap-3 md:px-3 md:py-2 md:text-base ${
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
