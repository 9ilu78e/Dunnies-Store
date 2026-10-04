"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LoaderCircle } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  recipientRole: string;
  orderId?: string | null;
};

export default function NotificationBell({
  role = "user",
  onUnreadCountChange,
}: {
  role?: "user" | "admin";
  onUnreadCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?role=${role}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [role]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  const handleNotificationOpen = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: notification.id }),
      });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
    }

    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-8 items-center justify-center rounded-full text-gray-700 transition hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="mt-0.5 text-xs text-gray-500">Order updates and alerts</p>
            </div>
            <Link
              href={role === "admin" ? "/admin/notifications" : "/notifications"}
              className="text-xs font-medium text-purple-600 hover:text-purple-700"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationOpen(notification)}
                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition ${
                    notification.isRead ? "bg-white" : "bg-purple-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
