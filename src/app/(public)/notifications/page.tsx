"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ArrowLeft, ExternalLink } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?role=user", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to load notifications");
        }
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 hover:text-purple-600">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-sm font-medium text-purple-600">My account</p>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-lg font-semibold text-gray-900">No notifications yet</p>
              <p className="mt-2 text-sm text-gray-500">We will notify you when your orders are updated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || "/orders"}
                  className={`block rounded-2xl border p-4 transition ${
                    notification.isRead ? "border-gray-200 bg-white" : "border-purple-200 bg-purple-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                        )}
                        <p className="text-base font-semibold text-gray-900">{notification.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
