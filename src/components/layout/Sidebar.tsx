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
  Mail,
  MessageSquareText,
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
    label: "Order History",
    href: "/order-history",
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
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: Mail,
  },
  {
    label: "Contact Messages",
    href: "/admin/contact-messages",
    icon: MessageSquareText,
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
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-white text-gray-800">
      <div className="space-y-3 border-b border-gray-200 px-5 py-4">
        <p className="text-[20px] font-bold uppercase tracking-[0.15em] text-purple-700">
          Dunnis Admin
        </p>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-200">
            {user ? (
              <UserAvatar
                src={user.photoURL}
                alt={user.fullName || user.email || "Admin"}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-gray-600" />
            )}
          </div>
          <div className="min-w-0 text-gray-700">
            <p className="text-[13px] text-gray-500">Signed in as</p>
            <p className="font-semibold text-xs leading-tight truncate">
              {user?.fullName || "Admin"}
            </p>
            <p className="truncate text-[13px] text-gray-500">
              {user?.email || "admin@dunnis.store"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${
                isActive
                  ? "bg-purple-50 font-semibold text-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
        © {new Date().getFullYear()} Dunnis Stores
      </div>
    </aside>
  );
}
