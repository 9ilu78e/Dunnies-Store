"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Package, ShoppingCart, Users } from "lucide-react";
import Loader from "@/components/ui/Loader";

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: any[];
  bestSellers: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/current");
        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.user?.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const productsRes = await fetch("/api/products");
        const productsData = productsRes.ok
          ? await productsRes.json()
          : { products: [] };

        const giftsRes = await fetch("/api/gifts");
        const giftsData = giftsRes.ok ? await giftsRes.json() : { gifts: [] };

        const groceriesRes = await fetch("/api/groceries");
        const groceriesData = groceriesRes.ok
          ? await groceriesRes.json()
          : { groceries: [] };

        const ordersRes = await fetch("/api/orders");
        const ordersData = ordersRes.ok
          ? await ordersRes.json()
          : { orders: [] };

        const usersRes = await fetch("/api/users");
        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };

        const orders = ordersData.orders || [];
        const products = productsData.products || [];
        const gifts = giftsData.gifts || [];
        const groceries = groceriesData.groceries || [];
        const users = usersData.users || [];

        const allItems = [...products, ...gifts, ...groceries];
        const totalRevenue = orders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0
        );

        const recentOrders = orders
          .slice(0, 5)
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        const bestSellers = allItems
          .sort((a: any, b: any) => (b.ordersCount || 0) - (a.ordersCount || 0))
          .slice(0, 5);

        setData({
          totalProducts: allItems.length,
          totalOrders: orders.length,
          totalRevenue: totalRevenue,
          totalCustomers: users.length,
          recentOrders,
          bestSellers,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthorized]);

  const stats = [
    {
      label: "Total Products",
      value: data?.totalProducts || 0,
      trend: `${data?.totalProducts || 0} items`,
      icon: Package,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      label: "Total Orders",
      value: data?.totalOrders || 0,
      trend: `${data?.totalOrders || 0} orders`,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: `₦${(data?.totalRevenue || 0).toLocaleString()}`,
      trend: "Overall revenue",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Total Customers",
      value: data?.totalCustomers || 0,
      trend: `${data?.totalCustomers || 0} users`,
      icon: Users,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Monitor real-time store metrics and performance
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader text="Loading dashboard data..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <div className={`${stat.bgColor} rounded-2xl p-3`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${stat.color} mb-2`}>
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.trend}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recent Orders
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Latest {data?.recentOrders?.length || 0} orders
                  </p>
                </div>
              </div>
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-4 text-sm hover:bg-gray-50/50 px-2 rounded transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          Order #{order.id?.slice(-6) || "---"}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 min-w-[100px] text-right">
                        ₦{(order.total || 0).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ml-4 ${
                          order.status === "completed"
                            ? "bg-green-50 text-green-600"
                            : order.status === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No orders yet</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Top Products
              </h2>
              {data?.bestSellers && data.bestSellers.length > 0 ? (
                <div className="space-y-4">
                  {data.bestSellers.map((product: any, index: number) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {index + 1}. {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ₦{(product.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No products yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
