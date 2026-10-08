"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle,
  XCircle,
  Clock3,
  LoaderCircle,
  LogIn,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { formatOrderNumber } from "@/lib/orderNumber";

interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice?: number | null;
  size?: string | null;
  product?: { name: string; imageUrl?: string | null; imageUrls?: string[] } | null;
  gift?: { name: string; imageUrl?: string | null; imageUrls?: string[] } | null;
  souvenir?: { name: string; imageUrl?: string | null; imageUrls?: string[] } | null;
}

interface OrderRecord {
  id: string;
  orderNumber: number;
  customerName?: string;
  customerPhone?: string;
  status: string;
  total: number;
  deliveryFee?: number | null;
  createdAt: string;
  notes?: string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  orderItems?: OrderItemData[];
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [requestedOrderNumber, setRequestedOrderNumber] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");

  const retryPayment = async (orderId: string) => {
    setPayingOrderId(orderId);
    setPaymentError("");
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start payment.");
      if (typeof data.authorizationUrl !== "string") {
        throw new Error("Paystack did not return a payment link.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (paymentStartError) {
      setPaymentError(
        paymentStartError instanceof Error
          ? paymentStartError.message
          : "Unable to start payment."
      );
      setPayingOrderId(null);
    }
  };

  const deleteOrder = async (order: OrderRecord) => {
    const orderNumber = formatOrderNumber(order.orderNumber);
    if (
      !window.confirm(
        `Remove order #${orderNumber} from your active orders? The store will retain it in order history.`
      )
    ) {
      return;
    }

    setDeletingOrderId(order.id);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this order.");
      }

      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id)
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setAuthRequired(false);
        const response = await fetch("/api/orders", { credentials: "same-origin" });

        if (response.status === 401) {
          setAuthRequired(true);
          setOrders([]);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your orders.");
        }

        const data = await response.json();
        const loadedOrders: OrderRecord[] = data.orders || [];
        const orderNumber =
          new URLSearchParams(window.location.search).get("orderNumber") || "";
        setOrders(loadedOrders);
        setRequestedOrderNumber(orderNumber);
        if (orderNumber) {
          const requestedOrder = loadedOrders.find(
            (order) => formatOrderNumber(order.orderNumber) === orderNumber
          );
          setExpandedOrderId(requestedOrder?.id ?? null);
        }
        setError(null);
      } catch (err) {
        setAuthRequired(false);
        setError(err instanceof Error ? err.message : "Unable to load your orders.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const tabs = useMemo(() => {
    return [
      { id: "all", label: "All Orders", count: orders.length },
      { id: "pending", label: "Pending", count: orders.filter((order) => order.status === "pending").length },
      { id: "processing", label: "Processing", count: orders.filter((order) => order.status === "processing").length },
      { id: "delivered", label: "Delivered", count: orders.filter((order) => order.status === "delivered").length },
    ];
  }, [orders]);

  const [activeTab, setActiveTab] = useState("all");
  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => {
          if (activeTab === "processing") {
            return order.status === "processing";
          }
          return order.status === activeTab;
        });
  const displayedOrders = requestedOrderNumber
    ? filteredOrders.filter(
        (order) => formatOrderNumber(order.orderNumber) === requestedOrderNumber
      )
    : filteredOrders;

  useEffect(() => {
    if (!requestedOrderNumber) return;
    document
      .getElementById(`order-${requestedOrderNumber}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [orders, requestedOrderNumber]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">My Orders</h1>
          <p className="text-gray-600">Track and manage all your orders</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {paymentError && (
          <p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {paymentError}
          </p>
        )}

        {authRequired ? (
          <div className="rounded-3xl border border-purple-100 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <LogIn className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Log in to view your orders
            </h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">
              You need an active account to view your order history and tracking details.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition sm:w-auto sm:px-4 sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-12 text-center text-gray-600">
            Loading your orders...
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-purple-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">You haven’t placed any orders yet.</p>
            <Link href="/product" className="inline-block rounded-full bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedOrders.map((order) => {
              const statusLabel = ORDER_STATUS_LABELS[order.status] || "Unknown";
              const statusClasses = ORDER_STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700 border-gray-200";
              const StatusIcon =
                order.status === "delivered"
                  ? CheckCircle
                  : order.status === "processing"
                  ? Package
                  : order.status === "cancelled"
                  ? XCircle
                  : Clock3;

              return (
                <div id={`order-${formatOrderNumber(order.orderNumber)}`} key={order.id} className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    aria-expanded={expandedOrderId === order.id}
                    aria-controls={`order-details-${order.id}`}
                    onClick={() =>
                      setExpandedOrderId((currentId) =>
                        currentId === order.id ? null : order.id
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-5"
                  >
                    <span className="text-base font-bold text-gray-900 sm:text-lg">
                      Order #{formatOrderNumber(order.orderNumber)}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                        expandedOrderId === order.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedOrderId === order.id && (
                    <div id={`order-details-${order.id}`} className="border-t border-gray-200 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-bold text-gray-900">₦{(order.total || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${statusClasses.includes("text-") ? statusClasses.split("text-")[1]?.split(" ")[0] : "text-gray-700"}`} />
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
                          <p className="mt-1 text-sm font-semibold text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                          <p className="mt-1 text-sm font-semibold capitalize text-gray-800">{(order.paymentMethod || "Pay on delivery").replaceAll("-", " ")}</p>
                          <p className="mt-1 text-xs capitalize text-gray-500">Status: {order.paymentStatus || "pending"}</p>
                        </div>
                        <div className="bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Delivery details</p>
                          <p className="mt-1 text-sm font-semibold text-gray-800">{order.customerName || "Customer"}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p>
                          <p className="mt-1 text-sm font-semibold text-gray-800">{order.deliveryAddress || "Not provided"}</p>
                          {typeof order.deliveryFee === "number" && (
                            <p className="mt-1 text-xs text-gray-500">Delivery fee: ₦{order.deliveryFee.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      {order.paymentMethod === "paystack" && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                          <p className="text-sm text-gray-700">
                            Payment:{" "}
                            <span
                              className={`font-semibold ${
                                order.paymentStatus === "paid"
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {order.paymentStatus === "paid"
                                ? "Paid"
                                : "Payment required before delivery"}
                            </span>
                          </p>
                          {order.paymentStatus !== "paid" && (
                            <button
                              type="button"
                              onClick={() => void retryPayment(order.id)}
                              disabled={payingOrderId !== null}
                              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                            >
                              {payingOrderId === order.id && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              )}
                              {payingOrderId === order.id
                                ? "Starting payment..."
                                : "Pay now"}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
                        <div className="space-y-3">
                          {(order.orderItems || []).map((item) => {
                            const catalogItem = item.product || item.gift || item.souvenir;
                            const itemName = catalogItem?.name || "Store item";
                            const imageUrl =
                              catalogItem?.imageUrls?.[0] || catalogItem?.imageUrl;
                            return (
                              <div key={item.id} className="flex items-center gap-3 border border-gray-100 bg-white p-3 text-sm text-gray-700">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 object-cover" />
                                ) : (
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gray-100">
                                    <Package className="h-7 w-7 text-gray-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900">{itemName}</p>
                                  {item.size && <p className="mt-1 text-xs text-gray-500">Size: {item.size}</p>}
                                  <p className="mt-1 text-xs text-gray-500">Qty {item.quantity}</p>
                                </div>
                                {typeof item.unitPrice === "number" && (
                                  <p className="shrink-0 font-semibold text-gray-900">
                                    ₦{(item.unitPrice * item.quantity).toLocaleString()}
                                  </p>
                                )}
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

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void deleteOrder(order)}
                      disabled={deletingOrderId !== null || payingOrderId === order.id}
                      className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingOrderId === order.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deletingOrderId === order.id ? "Deleting..." : "Delete order"}
                    </button>
                  </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
