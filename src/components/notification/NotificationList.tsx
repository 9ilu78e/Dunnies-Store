"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
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

const getDateGroup = (createdAt: string) => {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function NotificationList({ role }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const touchStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, NotificationItem[]>();
    for (const notification of notifications) {
      const group = getDateGroup(notification.createdAt);
      const items = groups.get(group) || [];
      items.push(notification);
      groups.set(group, items);
    }
    return Array.from(groups.entries());
  }, [notifications]);

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
    if (pressTimer.current) clearTimeout(pressTimer.current);
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
      return;
    }

    if (deltaX > 30) {
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

  const deleteAllNotifications = async () => {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) {
      return;
    }

    try {
      setDeleteAllBusy(true);
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete all notifications.");
      }
      setNotifications([]);
      setExpandedId(null);
      setRevealedId(null);
      window.dispatchEvent(new Event("dunnis:notifications-changed"));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete all notifications."
      );
    } finally {
      setDeleteAllBusy(false);
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

  if (notifications.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f8f6f8] px-5 py-12 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-purple-500 shadow-sm">
          <Bell className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-gray-900">You’re all caught up</p>
        <p className="mt-2 max-w-xs text-sm text-gray-500">
          You can manage order notifications here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee7ed] pb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Your updates</p>
          <p className="mt-1 text-xs text-gray-500">
            {notifications.filter((item) => !item.isRead).length} unread
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => void deleteAllNotifications()}
            disabled={deleteAllBusy}
            className="inline-flex items-center gap-2 rounded-full border border-[#eddada] bg-white px-3 py-2 text-xs font-semibold text-[#8c4545] transition hover:bg-[#fbf3f3] disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteAllBusy ? "Deleting..." : "Clear all"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {groupedNotifications.map(([group, items]) => (
        <section key={group} className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
            {group}
          </h2>
          <div className="space-y-2.5">
            {items.map((notification) => {
              const isExpanded = expandedId === notification.id;
              const isRevealed = revealedId === notification.id;
              return (
                <div
                  key={notification.id}
                  className="relative touch-pan-y overflow-hidden rounded-[20px] bg-[#f0cdcd]"
                  onPointerDown={(event) => handlePointerDown(event, notification.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={clearPointer}
                  onPointerCancel={clearPointer}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete notification "${notification.title}"?`
                        )
                      ) {
                        void updateNotification(notification, "delete");
                      }
                    }}
                    disabled={busyId === notification.id}
                    className={`absolute inset-y-0 right-0 flex w-20 items-center justify-center gap-1.5 text-xs font-semibold text-[#7a3232] transition-opacity disabled:opacity-60 ${
                      isRevealed ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    aria-label={`Delete ${notification.title}`}
                    tabIndex={isRevealed ? 0 : -1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <article
                    className={`relative rounded-[20px] border px-3.5 py-3 transition-transform duration-200 sm:px-4 ${
                      notification.isRead
                        ? "border-[#eee5eb] bg-[#f7f5f6]"
                        : "border-[#eadce8] bg-[#f5f0f3]"
                    } ${isRevealed ? "-translate-x-20" : "translate-x-0"}`}
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => void toggleDetails(notification)}
                      className="block w-full text-left"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            notification.isRead
                              ? "bg-[#e8e6e8] text-gray-600"
                              : "bg-[#e7e5fb] text-[#6e61ce]"
                          }`}
                        >
                          {notification.title.trim().charAt(0).toUpperCase() || (
                            <Bell className="h-4 w-4" />
                          )}
                          {!notification.isRead && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#7b3fe4] ring-2 ring-[#f5f0f3]" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-gray-900">
                              {notification.title}
                            </span>
                            <ChevronDown
                              className={`mt-0.5 h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </span>
                          <span className="mt-1.5 block text-[11px] text-gray-500">
                            {new Date(notification.createdAt).toLocaleString([], {
                              month: "numeric",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {isExpanded && (
                            <span className="mt-3 block border-t border-[#e8dfe5] pt-3">
                              <span className="block whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                {notification.message}
                              </span>
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                    {isExpanded && notification.link && (
                      <div className="mt-2 pl-[52px]">
                        <a
                          href={notification.link}
                          className="text-xs font-semibold text-purple-700 hover:underline"
                        >
                          Open details
                        </a>
                      </div>
                    )}
                    {isExpanded && !notification.isRead && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          disabled={busyId === notification.id}
                          onClick={() => void updateNotification(notification, "read")}
                          className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-[#ddd6e4] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          Mark as read
                        </button>
                      </div>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
