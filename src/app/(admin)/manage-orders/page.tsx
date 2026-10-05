"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Eye,
  Package,
  Search,
  ChevronDown,
  Loader2,
  MapPin,
  CreditCard,
  Phone,
  History,
} from "lucide-react";
import { formatOrderNumber } from "@/lib/orderNumber";

interface OrderItemData {
  id: string;
  quantity: number;
  size?: string | null;
  product?: { id: string; name: string } | null;
  gift?: { id: string; name: string } | null;
  souvenir?: { id: string; name: string } | null;
}

interface OrderRecord {
  id: string;
  orderNumber: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: string;
  total: number;
  createdAt: string;
  notes?: string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  orderItems?: OrderItemData[];
}

type SortKey = "newest" | "oldest" | "amount";

const STATUS_META: Record<string, { label: string; classes: string; next?: string[] }> = {
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border-amber-200", next: ["confirmed", "cancelled"] },
  confirmed: { label: "Confirmed", classes: "bg-blue-50 text-blue-700 border-blue-200", next: ["processing", "cancelled"] },
  processing: { label: "Processing", classes: "bg-violet-50 text-violet-700 border-violet-200", next: ["delivered", "cancelled"] },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", classes: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_BUTTONS: Record<string, string> = {
  pending: "Confirm order",
  confirmed: "Mark processing",
  processing: "Mark delivered",
};

const FLOW = ["pending", "confirmed", "processing", "delivered"];
const PAGE_SIZE = 10;

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;

const timeAgo = (iso: string) => {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const itemName = (item: OrderItemData) =>
  item.product?.name || item.gift?.name || item.souvenir?.name || "Product";

const itemHref = (item: OrderItemData) =>
  item.product
    ? `/product/${item.product.id}`
    : item.gift
    ? `/gift/${item.gift.id}`
    : item.souvenir
    ? `/souvenirs/${item.souvenir.id}`
    : null;

function Stepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return <span className="text-xs font-medium text-red-600">Order cancelled</span>;
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="flex items-center" aria-label={`Progress: ${STATUS_META[status]?.label || status}`}>
      {FLOW.map((s, i) => (
        <li key={s} className="flex items-center">
          <span
            title={STATUS_META[s].label}
            className={`h-2.5 w-2.5 rounded-full ${
              i <= idx ? "bg-linear-to-r from-purple-600 to-pink-600" : "bg-gray-200"
            }`}
          />
          {i < FLOW.length - 1 && (
            <span className={`h-0.5 w-5 ${i < idx ? "bg-purple-300" : "bg-gray-200"}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="h-3 w-56 rounded-full bg-gray-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-gray-100" />
        <div className="h-9 w-32 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders", { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error("Unable to load orders.");
        }
        const data = await response.json();
        setOrders(data.orders || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  useEffect(() => setVisibleCount(PAGE_SIZE), [statusFilter, search, sortKey]);

  const totalsByStatus = useMemo(() => {
    return Object.fromEntries(
      Object.keys(STATUS_META).map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ])
    );
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    const list = orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        formatOrderNumber(o.orderNumber).toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerEmail || "").toLowerCase().includes(q)
      );
    });
    const time = (o: OrderRecord) => new Date(o.createdAt).getTime() || 0;
    return list.sort((a, b) =>
      sortKey === "amount"
        ? (b.total || 0) - (a.total || 0)
        : sortKey === "oldest"
        ? time(a) - time(b)
        : time(b) - time(a)
    );
  }, [orders, statusFilter, search, sortKey]);

  const shown = filtered.slice(0, visibleCount);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not update order status.");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: data.order.status } : order
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = async (orderId: string) => {
    if (
      !window.confirm(
        "Move this order to order history? You can restore it later."
      )
    ) {
      return;
    }

    try {
      setUpdatingId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not move order to history.");
      }

      setOrders((current) => current.filter((order) => order.id !== orderId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move order to history.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status: string) =>
    STATUS_META[status]?.classes || "bg-gray-100 text-gray-700 border-gray-200";

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    ...Object.entries(STATUS_META).map(([key, m]) => ({
      key,
      label: m.label,
      count: totalsByStatus[key] || 0,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Orders
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Track, update and fulfil customer orders
          </p>
        </div>
        <Link
          href="/order-history"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-purple-200 text-purple-600 px-5 py-2.5 text-sm font-semibold hover:bg-purple-50 transition"
        >
          <History className="h-4 w-4" />
          Order history
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Toolbar */}
      {!loading && orders.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, name or email"
                className="w-full rounded-full bg-gray-50 border border-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort orders"
              className="rounded-full bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                aria-pressed={statusFilter === t.key}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
                  statusFilter === t.key
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    statusFilter === t.key ? "bg-white/25" : "bg-white text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-12 text-center">
          <Package className="mx-auto mb-4 h-14 w-14 text-purple-300" />
          <p className="text-lg font-semibold text-gray-700">No orders yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Customer orders will appear here once they are placed.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-gray-100 p-12 text-center">
          <Search className="w-10 h-10 text-purple-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">No orders match your filters</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Try a different search or status.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="rounded-full border-2 border-purple-200 text-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-50 transition"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {shown.length} of {filtered.length} orders
          </p>

          <div className="space-y-3">
            {shown.map((order) => {
              const meta = STATUS_META[order.status] || {
                label: "Unknown",
                classes: "bg-gray-100 text-gray-700 border-gray-200",
              };
              const nextStatus = STATUS_META[order.status]?.next?.[0];
              const isOpen = expanded.has(order.id);
              const busy = updatingId === order.id;
              const items = order.orderItems || [];
              const itemCount = items.reduce((n, i) => n + (i.quantity || 0), 0);
              const number = formatOrderNumber(order.orderNumber);
              const siteItemHref = items[0] ? itemHref(items[0]) : null;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-sm font-bold text-gray-900">Order #{number}</p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusClass(order.status)}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400" title={new Date(order.createdAt).toLocaleString()}>
                          {timeAgo(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold text-gray-900 truncate">
                        {order.customerName || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.customerEmail || "No email"}
                      </p>
                    </div>

                    {/* Progress + amount */}
                    <div className="flex items-center justify-between gap-6 lg:justify-end">
                      <div className="space-y-1.5">
                        <Stepper status={order.status} />
                        <p className="text-xs text-gray-500">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <p className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent min-w-[96px] text-right">
                        {naira(order.total)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {nextStatus && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                          {STATUS_BUTTONS[order.status] || "Advance status"}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(order.id, "cancelled")}
                          disabled={busy}
                          className="inline-flex items-center rounded-full border-2 border-red-200 px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        href={siteItemHref || `/orders?orderNumber=${number}#order-${number}`}
                        target="_blank"
                        rel="noreferrer"
                        title={siteItemHref ? "View the first ordered item on site" : "Check order on site"}
                        aria-label={`View order ${number}'s item on site`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleArchive(order.id)}
                        disabled={busy}
                        title="Move to order history"
                        aria-label={`Move order ${number} to history`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(order.id)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Hide order details" : "Show order details"}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Collapsed preview */}
                  {!isOpen && items.length > 0 && (
                    <p className="px-4 pb-3 -mt-1 text-xs text-gray-500 truncate">
                      {items
                        .slice(0, 3)
                        .map((i) => `${i.quantity}× ${itemName(i)}`)
                        .join(", ")}
                      {items.length > 3 && ` and ${items.length - 3} more`}
                    </p>
                  )}

                  {/* Details */}
                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/40 rounded-b-2xl">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-white border border-gray-100 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <MapPin className="h-3.5 w-3.5" /> Delivery
                          </p>
                          <p className="mt-1.5 text-sm text-gray-700">
                            {order.deliveryAddress || "No address provided"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <CreditCard className="h-3.5 w-3.5" /> Payment
                          </p>
                          <p className="mt-1.5 text-sm text-gray-700">
                            {order.paymentMethod === "paystack"
                              ? `Paystack · ${
                                  order.paymentStatus === "paid"
                                    ? "Paid"
                                    : order.paymentStatus === "failed" ||
                                        order.paymentStatus === "cancelled"
                                      ? "Payment failed"
                                      : "Payment pending"
                                }`
                              : order.paymentMethod || "Pay on delivery"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <Phone className="h-3.5 w-3.5" /> Contact
                          </p>
                          <p className="mt-1.5 text-sm text-gray-700">
                            {order.customerPhone ? (
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="font-medium text-purple-700 hover:underline"
                              >
                                {order.customerPhone}
                              </a>
                            ) : (
                              "No phone provided"
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-500">
                          Items ({itemCount})
                        </p>
                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700"
                            >
                              {itemHref(item) ? (
                                <Link
                                  href={itemHref(item)!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-purple-700 hover:text-purple-900 hover:underline"
                                  title={`View ${itemName(item)} on site`}
                                >
                                  {itemName(item)}
                                  {item.size ? ` · ${item.size}` : ""}
                                </Link>
                              ) : (
                                <span className="truncate">
                                  {itemName(item)}
                                  {item.size ? ` · ${item.size}` : ""}
                                </span>
                              )}
                              <span className="ml-3 shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                                Qty {item.quantity}
                              </span>
                            </div>
                          ))}
                          {items.length === 0 && (
                            <p className="text-sm text-gray-400">No items recorded.</p>
                          )}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-sm text-gray-700">
                          <span className="font-semibold">Customer note:</span> {order.notes}
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Placed {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length > visibleCount && (
            <div className="flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full border-2 border-purple-200 text-purple-600 px-6 py-2.5 text-sm font-semibold hover:bg-purple-50 transition"
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}