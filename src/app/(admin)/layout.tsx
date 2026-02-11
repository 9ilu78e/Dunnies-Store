"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import LogoutModal from "@/components/layout/LogoutModal";
import { getCurrentUser } from "@/services/authService";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ 
  fullName?: string; 
  email?: string; 
  photoURL?: string;
} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchAdmin = async () => {
      try {
        console.log('=== ADMIN LAYOUT: Fetching current user ===');
        const currentUser = await getCurrentUser();
        console.log('Admin layout user data:', currentUser);
        
        // Transform user data to match expected format
        const transformedUser = currentUser ? {
          fullName: currentUser.displayName || currentUser.email?.split('@')[0] || undefined,
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || undefined
        } : null;
        
        console.log('Transformed user for sidebar:', transformedUser);
        setUser(transformedUser);
      } catch (error) {
        console.error('Admin layout fetch error:', error);
        setUser(null);
      }
    };
    fetchAdmin();
  }, [isClient]);

  const avatarUrl = useMemo(() => {
    if (!user) return "";
    
    // Use photoURL first (from Google), then fallback to email-based avatar
    if (user.photoURL) {
      return user.photoURL;
    }
    
    if (user.email) {
      return `https://unavatar.io/${encodeURIComponent(user.email)}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || "Admin"
    )}&background=0f172a&color=fff`;
  }, [user]);

  return (
    <div className="flex h-screen bg-linear-to-br from-purple-50 via-white to-purple-100">
      <div
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onNavClick={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-white/90 backdrop-blur border-b border-purple-100 px-2 sm:px-4 lg:px-6 h-14 sm:h-16 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button
              className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-gray-200 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <div className="hidden xs:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 min-w-0">
              <span className="hidden sm:inline">Admin</span>
              <span className="text-gray-300 hidden sm:inline">/</span>
              <span className="font-semibold text-gray-800 capitalize truncate">
                Control Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex items-center bg-linear-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all flex-1 min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-base focus:outline-none w-full text-gray-700 placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 transition shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <button className="relative p-1.5 sm:p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-full transition shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1 sm:gap-2 rounded-full border border-purple-100 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-white/80 hover:bg-white/90 transition shrink-0"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                {user && avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user.fullName || "Admin"}
                    width={32}
                    height={32}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs text-gray-500">Admin</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                  {user?.fullName || "Team"}
                </span>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
