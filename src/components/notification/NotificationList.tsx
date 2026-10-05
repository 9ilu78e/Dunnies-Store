"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Bell, Check, ChevronDown, LoaderCircle, Trash2 } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  role: "user" | "admin";
};

export default function NotificationList({ role }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const touchStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?role=${role}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load notifications.");
        }
        setNotifications(data.notifications || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    };
    void loadNotifications();
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, [role]);

  const updateNotification = async (
    notification: NotificationItem,
    action: "read" | "delete"
  ) => {
    setBusyId(notification.id);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: action === "delete" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: notification.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Unable to ${action} notification.`);
      }
      if (action === "delete") {
        setNotifications((current) =>
          current.filter((item) => item.id !== notification.id)
        );
      } else {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
      }
      window.dispatchEvent(new Event("dunnis:notifications-changed"));
      setRevealedId(null);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Unable to ${action} notification.`
      );
    } finally {
      setBusyId(null);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, id: string) => {
    if (event.pointerType !== "touch") return;
    touchStart.current = { id, x: event.clientX, y: event.clientY };
    longPressed.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
    }, 350);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    if (!start) return;
    if (Math.abs(event.clientY - start.y) > 18) {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      touchStart.current = null;
      return;
    }
    const deltaX = event.clientX - start.x;
    if (deltaX < -55) {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      setRevealedId(start.id);
      touchStart.current = null;
    } else if (longPressed.current && deltaX > 55) {
      setRevealedId(null);
      touchStart.current = null;
    }
  };

  const clearPointer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    touchStart.current = null;
  };

  const toggleDetails = async (notification: NotificationItem) => {
    const nextExpandedId =
      expandedId === notification.id ? null : notification.id;
    setExpandedId(nextExpandedId);
    setRevealedId(null);
    if (nextExpandedId && !notification.isRead) {
      await updateNotification(notification, "read");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-semibold text-gray-900">No notifications yet</p>
        <p className="mt-2 text-sm text-gray-500">
          You can manage order notifications here.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notifications.map((notification) => {
        return (
          <div
            key={notification.id}
            className="relative touch-pan-y overflow-hidden rounded-2xl"
            onPointerDown={(event) => handlePointerDown(event, notification.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={clearPointer}
            onPointerCancel={clearPointer}
            onContextMenu={(event) => {
              event.preventDefault();
              setRevealedId(notification.id);
            }}
          >
            <button
              type="button"
              onClick={() => void updateNotification(notification, "delete")}
              disabled={busyId === notification.id}
              className="absolute inset-y-0 right-0 flex w-24 items-center justify-center gap-1 bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 md:hidden"
              aria-label={`Delete ${notification.title}`}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <article
              className={`relative rounded-2xl border p-4 transition-transform duration-200 ${
                notification.isRead
                  ? "border-gray-200 bg-white"
                  : "border-purple-200 bg-purple-50/60"
              } ${revealedId === notification.id ? "-translate-x-24" : "translate-x-0"}`}
            >
              <button
                type="button"
                aria-expanded={expandedId === notification.id}
                onClick={() => void toggleDetails(notification)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                      )}
                      <p className="text-base font-semibold text-gray-900">
                        {notification.title}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      expandedId === notification.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                {expandedId === notification.id && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {notification.message}
                    </p>
                  </div>
                )}
              </button>
              {expandedId === notification.id && notification.link && (
                <a
                  href={notification.link}
                  className="mt-2 inline-flex text-xs font-semibold text-purple-700 hover:underline"
                >
                  Open details
                </a>
              )}
              <div className="mt-3 flex justify-end gap-2">
                {!notification.isRead && (
                  <button
                    type="button"
                    disabled={busyId === notification.id}
                    onClick={() => void updateNotification(notification, "read")}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark as read
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === notification.id}
                  onClick={() => void updateNotification(notification, "delete")}
                  className="hidden items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 md:inline-flex"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
