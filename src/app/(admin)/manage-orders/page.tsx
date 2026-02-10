"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Download, Plus, Eye } from "lucide-react";
import Loader from "@/components/ui/Loader";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items?: any[];
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders");
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data.orders || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "processing":
      case "in transit":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "cancelled":
      case "refunded":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Orders
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Manage {orders.length} customer orders
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader text="Loading orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center p-12">
          <ShoppingCart className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg font-semibold">
            No orders yet
          </p>
          <p className="text-gray-500">Orders placed by customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Order ID
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    #{order.id?.slice(-6) || "---"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Amount
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ₦{(order.total || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Date
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Status
                  </p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status || "pending"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
