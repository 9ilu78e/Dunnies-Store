"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, User } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import AdminLogoutModal from "@/components/layout/AdminLogoutModal";
import NotificationBell from "@/components/notification/NotificationBell";
import { getCurrentUser } from "@/services/authService";
import UserAvatar from "@/components/ui/UserAvatar";

interface AdminSearchResult {
  id: string;
  title: string;
  detail?: string;
  type: string;
  href: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
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

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      setSearchResults([]);
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }
        setSearchResults(data.results || []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setSearchError(
          error instanceof Error ? error.message : "Search failed"
        );
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const openSearchResult = (result: AdminSearchResult) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(result.href);
  };

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-linear-to-br from-purple-50 via-white to-purple-100">
      <div
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onNavClick={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-2 sm:px-4 lg:px-6 h-14 sm:h-16 gap-2 text-gray-700 backdrop-blur">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button
              className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0"
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
            <div className="relative flex-1 min-w-0">
              <div className="flex min-w-0 items-center rounded-full border-2 border-gray-200 bg-white px-2 py-1.5 shadow-sm transition-all hover:shadow-md sm:px-4 sm:py-2">
                <Search className="h-4 w-4 shrink-0 text-gray-500 sm:h-5 sm:w-5" />
                <input
                  type="search"
                  placeholder="Search products, orders, users..."
                  value={searchQuery}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setShowSearchResults(false);
                    if (event.key === "Enter" && searchResults[0]) {
                      openSearchResult(searchResults[0]);
                    }
                  }}
                  aria-label="Search admin records"
                  aria-expanded={showSearchResults}
                  aria-controls="admin-search-results"
                  className="w-full bg-transparent px-2 py-0.5 text-xs text-gray-700 placeholder:text-gray-500 focus:outline-none sm:px-3 sm:py-1 sm:text-base"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear admin search"
                    className="shrink-0 text-gray-400 transition hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              {showSearchResults && searchQuery.trim().length >= 2 && (
                <div
                  id="admin-search-results"
                  className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-purple-100 bg-white p-2 shadow-xl"
                >
                  {searchLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      Searching...
                    </p>
                  ) : searchError ? (
                    <p className="px-3 py-2 text-sm text-red-600">
                      {searchError}
                    </p>
                  ) : searchResults.length ? (
                    searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => openSearchResult(result)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-purple-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-800">
                            {result.title}
                          </span>
                          {result.detail && (
                            <span className="block truncate text-xs text-gray-500">
                              {result.detail}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-purple-600">
                          {result.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      No matching admin records
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <NotificationBell role="admin" />
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-white hover:bg-gray-50 transition shrink-0"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                {user ? (
                  <UserAvatar
                    src={user.photoURL}
                    alt={user.fullName || user.email || "Admin"}
                    width={32}
                    height={32}
                    className="object-cover"
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

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <AdminLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLoggedOut={() => setUser(null)}
      />
    </div>
  );
}
