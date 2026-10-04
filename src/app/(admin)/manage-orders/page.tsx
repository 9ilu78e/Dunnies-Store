"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Eye, Package } from "lucide-react";
import { formatOrderNumber } from "@/lib/orderNumber";

interface OrderItemData {
  id: string;
  quantity: number;
  size?: string | null;
  product?: { name: string } | null;
  gift?: { name: string } | null;
  souvenir?: { name: string } | null;
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
  orderItems?: OrderItemData[];
}

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

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const totalsByStatus = useMemo(() => {
    return Object.fromEntries(
      Object.keys(STATUS_META).map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ])
    );
  }, [orders]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600">Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Manage orders</h1>
          <Link
            href="/order-history"
            className="mt-2 inline-flex text-sm font-semibold text-purple-700 hover:text-purple-900"
          >
            View order history
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <span key={status} className={`inline-flex items-center rounded-full border px-2.5 py-1 ${meta.classes}`}>
              {meta.label}: {totalsByStatus[status] || 0}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center text-gray-600">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-purple-500" />
          <p className="text-lg font-semibold text-gray-700">No orders yet</p>
          <p className="mt-2 text-sm text-gray-500">Customer orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = STATUS_META[order.status] || { label: "Unknown", classes: "bg-gray-100 text-gray-700 border-gray-200" };
            const nextStatus = STATUS_META[order.status]?.next?.[0];

            return (
              <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold text-gray-500">Order #{formatOrderNumber(order.orderNumber)}</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {order.customerName || "Customer"}
                    </p>
                    <p className="text-sm text-gray-500">{order.customerEmail || "No email"} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders?orderNumber=${formatOrderNumber(order.orderNumber)}#order-${formatOrderNumber(order.orderNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                    >
                      <Eye className="h-4 w-4" />
                      Check order on site
                    </Link>
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {STATUS_BUTTONS[order.status] || "Advance status"}
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(order.id, "cancelled")}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleArchive(order.id)}
                      disabled={updatingId === order.id}
                      title="Move this order to order history"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Archive className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">₦{(order.total || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Delivery</p>
                    <p className="mt-1 text-sm text-gray-700">{order.deliveryAddress || "No address provided"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                    <p className="mt-1 text-sm text-gray-700">{order.paymentMethod || "Pay on delivery"}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
                  <div className="space-y-2">
                    {(order.orderItems || []).map((item) => {
                      const itemName = item.product?.name || item.gift?.name || item.souvenir?.name || "Product";

                      return (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <span>
                            {itemName}
                            {item.size ? ` · ${item.size}` : ""}
                          </span>
                          <span className="font-medium">Qty {item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    <span className="font-semibold text-gray-700">Notes:</span> {order.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
