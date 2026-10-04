"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArchiveRestore, Package } from "lucide-react";
import { formatOrderNumber } from "@/lib/orderNumber";

interface ArchivedOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  createdAt: string;
  archivedAt: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/orders?archived=true", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load order history.");
        }
        setOrders(data.orders || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load order history."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const restoreOrder = async (orderId: string) => {
    try {
      setRestoringId(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ archived: false }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to restore this order.");
      }
      setOrders((current) => current.filter((order) => order.id !== orderId));
      setError(null);
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore this order."
      );
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600">
          Operations
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Order history</h1>
        <p className="mt-2 text-sm text-gray-600">
          Deleted orders are kept here and can be restored to active orders.
        </p>
        <Link
          href="/manage-orders"
          className="mt-3 inline-flex text-sm font-semibold text-purple-700 hover:text-purple-900"
        >
          Back to active orders
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center text-gray-600">
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-purple-400" />
          <p className="text-lg font-semibold text-gray-900">No archived orders</p>
          <p className="mt-2 text-sm text-gray-600">
            Orders deleted from the active list will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Order #{formatOrderNumber(order.orderNumber)} · {order.status}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {order.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  {order.customerEmail} · Placed{" "}
                  {new Date(order.createdAt).toLocaleDateString()} · Moved to
                  history{" "}
                  {new Date(order.archivedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 font-semibold text-gray-800">
                  ₦{order.total.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void restoreOrder(order.id)}
                disabled={restoringId === order.id}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArchiveRestore className="h-4 w-4" />
                Restore order
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
