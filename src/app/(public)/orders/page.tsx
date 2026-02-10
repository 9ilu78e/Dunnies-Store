"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  ChevronDown,
} from "lucide-react";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const orders = [
    {
      id: "#ORD-2024-001",
      date: "November 15, 2024",
      status: "Delivered",
      total: 129.99,
      items: [
        {
          name: "Premium Gift Basket",
          quantity: 1,
          price: 89.99,
          image:
            "https://images.unsplash.com/photo-1558298827-1f7a3b6d865d?w=100&q=80",
        },
        {
          name: "Organic Chocolates",
          quantity: 2,
          price: 20.0,
          image:
            "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100&q=80",
        },
      ],
      statusColor: "text-green-600",
      bgColor: "bg-green-100",
      icon: CheckCircle,
      tracking: "TRK123456789",
    },
    {
      id: "#ORD-2024-002",
      date: "November 12, 2024",
      status: "In Transit",
      total: 89.5,
      items: [
        {
          name: "Fresh Fruit Box",
          quantity: 1,
          price: 34.99,
          image:
            "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=100&q=80",
        },
        {
          name: "Dairy Bundle",
          quantity: 1,
          price: 54.51,
          image:
            "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=100&q=80",
        },
      ],
      statusColor: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: Truck,
      tracking: "TRK987654321",
    },
    {
      id: "#ORD-2024-003",
      date: "November 08, 2024",
      status: "Processing",
      total: 245.0,
      items: [
        {
          name: "Luxury Jewelry Set",
          quantity: 1,
          price: 199.99,
          image:
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&q=80",
        },
        {
          name: "Gift Wrapping",
          quantity: 1,
          price: 15.0,
          image:
            "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=100&q=80",
        },
        {
          name: "Greeting Card",
          quantity: 3,
          price: 10.01,
          image:
            "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=100&q=80",
        },
      ],
      statusColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: Clock,
      tracking: "Pending",
    },
    {
      id: "#ORD-2024-004",
      date: "November 01, 2024",
      status: "Cancelled",
      total: 67.99,
      items: [
        {
          name: "Spa Gift Set",
          quantity: 1,
          price: 67.99,
          image:
            "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100&q=80",
        },
      ],
      statusColor: "text-red-600",
      bgColor: "bg-red-100",
      icon: XCircle,
      tracking: "N/A",
    },
  ];

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    {
      id: "delivered",
      label: "Delivered",
      count: orders.filter((o) => o.status === "Delivered").length,
    },
    {
      id: "transit",
      label: "In Transit",
      count: orders.filter((o) => o.status === "In Transit").length,
    },
    {
      id: "processing",
      label: "Processing",
      count: orders.filter((o) => o.status === "Processing").length,
    },
  ];

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) =>
          activeTab === "delivered"
            ? order.status === "Delivered"
            : activeTab === "transit"
            ? order.status === "In Transit"
            : activeTab === "processing"
            ? order.status === "Processing"
            : true
        );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage all your orders</p>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID, product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Filter</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[150px] px-6 py-4 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600 bg-purple-50"
                    : "border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-purple-200 text-purple-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet
              </p>
              <Link
                href="/"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = order.icon;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  {}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-base font-bold text-gray-900">
                          {order.id}
                        </h3>
                        <span
                          className={`${order.bgColor} ${order.statusColor} px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span>{order.status}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          {order.date}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Link>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 font-semibold text-sm">
                          <Download className="w-4 h-4" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200">
                      <div className="mb-4 sm:mb-0">
                        {order.tracking !== "N/A" &&
                          order.tracking !== "Pending" && (
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Tracking:</span>{" "}
                              {order.tracking}
                            </p>
                          )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <p className="text-gray-600">Total:</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {}
                    <div className="flex flex-wrap gap-3 mt-6">
                      {order.status === "Delivered" && (
                        <>
                          <Link
                            href={`/orders/${order.id}/review`}
                            className="flex-1 min-w-[150px] bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all text-center"
                          >
                            Write Review
                          </Link>
                          <Link
                            href={`/orders/${order.id}/return`}
                            className="flex-1 min-w-[150px] bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all text-center"
                          >
                            Return Items
                          </Link>
                        </>
                      )}
                      {order.status === "In Transit" && (
                        <Link
                          href={`/orders/${order.id}/track`}
                          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-center"
                        >
                          Track Order
                        </Link>
                      )}
                      {order.status === "Processing" && (
                        <button className="flex-1 bg-red-100 text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-200 transition-all">
                          Cancel Order
                        </button>
                      )}
                      <Link
                        href="/"
                        className="flex-1 min-w-[150px] border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all text-center"
                      >
                        Buy Again
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

