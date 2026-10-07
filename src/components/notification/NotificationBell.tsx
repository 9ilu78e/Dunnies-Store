"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

type NotificationSummary = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string | null;
};

const NOTIFICATIONS_CHANGED_EVENT = "dunnis:notifications-changed";
const notificationsUrl = (role: "user" | "admin") =>
  role === "admin" ? "/admin/notifications" : "/notifications";

export default function NotificationBell({
  role = "user",
  onUnreadCountChange,
}: {
  role?: "user" | "admin";
  onUnreadCountChange?: (count: number) => void;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?role=${role}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load notifications.");
        }
        if (active) {
          const notifications = data.notifications as NotificationSummary[] | undefined;
          setNotifications(notifications || []);
          setUnreadCount(
            typeof data.unreadCount === "number"
              ? data.unreadCount
              : (notifications || []).filter((notification) => !notification.isRead).length
          );
        }
      } catch (error) {
        console.error("Unable to load notifications:", error);
      }
    };

    void fetchNotifications();
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void fetchNotifications();
    };
    const refreshAfterChange = () => void fetchNotifications();
    const poll = window.setInterval(() => void fetchNotifications(), 30_000);
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshAfterChange);
    const closeOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOutside);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshAfterChange);
      document.removeEventListener("mousedown", closeOutside);
    };
  }, [role]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  const badge = unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {unreadCount}
    </span>
  );

  return (
    <>
      <Link
        href={notificationsUrl(role)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-10 w-8 items-center justify-center rounded-full text-gray-700 transition hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 lg:hidden"
      >
        <Bell className="h-5 w-5" />
        {badge}
      </Link>
      <div ref={dropdownRef} className="relative hidden lg:block">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-purple-50 hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        >
          <Bell className="h-5 w-5" />
          {badge}
        </button>
        {isOpen && (
          <div className="absolute right-0 z-[100] mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">
                  {unreadCount} unread
                </p>
              </div>
              <Link
                href={notificationsUrl(role)}
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-purple-700 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.slice(0, 8).map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || notificationsUrl(role)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition hover:bg-purple-50 ${
                      notification.isRead ? "" : "bg-purple-50/50"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.isRead ? "bg-gray-200" : "bg-purple-600"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-gray-600">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
