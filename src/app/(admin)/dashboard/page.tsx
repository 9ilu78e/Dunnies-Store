"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import { formatOrderNumber } from "@/lib/orderNumber";
import {
  AreaChart,
  compactNaira,
  Donut,
  KpiCard,
  naira,
  Skeleton,
  type DayPoint,
  type Metric,
} from "./DashboardVisuals";

/* ----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

interface Order {
  id?: string;
  orderNumber: number;
  total?: number;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

interface CatalogItem {
  id?: string;
  name?: string;
  price?: number;
  ordersCount?: number;
  _type: "Product" | "Gift" | "Souvenir";
  [key: string]: any;
}

type Range = 7 | 30 | 90;

/* ----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

const NON_REVENUE = ["cancelled", "canceled", "failed", "refunded"];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const trendOf = (cur: number, prev: number): number | null => {
  if (prev === 0) return cur > 0 ? null : 0;
  return ((cur - prev) / prev) * 100;
};

const isRevenueOrder = (o: Order) =>
  !NON_REVENUE.includes((o.status || "").toLowerCase());

const statusMeta = (status?: string) => {
  const s = (status || "pending").toLowerCase();
  if (s === "completed" || s === "delivered")
    return { label: s, chip: "bg-green-50 text-green-600", color: "#10b981" };
  if (s === "pending")
    return { label: s, chip: "bg-yellow-50 text-yellow-600", color: "#f59e0b" };
  if (NON_REVENUE.includes(s))
    return { label: s, chip: "bg-rose-50 text-rose-600", color: "#f43f5e" };
  return { label: s, chip: "bg-blue-50 text-blue-600", color: "#3b82f6" };
};

const customerOf = (o: Order): string =>
  o.customerName ||
  o.user?.name ||
  o.customer?.name ||
  o.shippingAddress?.fullName ||
  o.email ||
  "";

/* ----------------------------------------------------------------------------
 * Page
 * -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

export default function AdminDashboard() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [range, setRange] = useState<Range>(30);
  const [metric, setMetric] = useState<Metric>("revenue");
  const [live, setLive] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [page, setPage] = useState(0);

  /* auth -------------------------------------------------------------- */
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
          router.push("/users-interface");
          return;
        }
        setIsAuthorized(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  /* data -------------------------------------------------------------- */
  const fetchData = useCallback(async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);

      const getList = async (url: string, key: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return [];
          const json = await res.json();
          return json[key] || [];
        } catch {
          return [];
        }
      };

      const [products, gifts, souvenirs, ordersList, usersRes] = await Promise.all([
        getList("/api/products", "products"),
        getList("/api/gifts", "gifts"),
        getList("/api/souvenirs", "souvenirs"),
        getList("/api/orders", "orders"),
        fetch("/api/users?count=true").catch(() => null),
      ]);

      let users = 0;
      let userWarning: string | null = null;
      if (usersRes && usersRes.ok) {
        const u = await usersRes.json();
        users = u.totalUsers || 0;
      } else {
        userWarning = "Couldn't load the customer count. Other metrics are up to date.";
      }

      setItems([
        ...products.map((p: any) => ({ ...p, _type: "Product" as const })),
        ...gifts.map((p: any) => ({ ...p, _type: "Gift" as const })),
        ...souvenirs.map((p: any) => ({ ...p, _type: "Souvenir" as const })),
      ]);
      setOrders(ordersList);
      setUserCount(users);
      setUpdatedAt(new Date());
      setError(userWarning);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) fetchData();
  }, [isAuthorized, fetchData]);

  useEffect(() => {
    if (!isAuthorized || !live) return;
    const t = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(t);
  }, [isAuthorized, live, fetchData]);

  /* analytics --------------------------------------------------------- */
  const a = useMemo(() => {
    const today = startOfDay(new Date());
    const start = addDays(today, -(range - 1));
    const prevStart = addDays(start, -range);

    const series: DayPoint[] = Array.from({ length: range }, (_, i) => ({
      date: addDays(start, i),
      revenue: 0,
      orders: 0,
    }));
    const index = new Map(series.map((d, i) => [dayKey(d.date), i]));

    let curRev = 0,
      curOrders = 0,
      prevRev = 0,
      prevOrders = 0;
    const inRange: Order[] = [];

    for (const o of orders) {
      const d = new Date(o.createdAt || "");
      if (isNaN(d.getTime())) continue;
      const sd = startOfDay(d).getTime();
      const total = o.total || 0;
      const counts = isRevenueOrder(o);

      if (sd >= start.getTime() && sd <= today.getTime()) {
        inRange.push(o);
        curOrders++;
        if (counts) curRev += total;
        const i = index.get(dayKey(d));
        if (i !== undefined) {
          series[i].orders++;
          if (counts) series[i].revenue += total;
        }
      } else if (sd >= prevStart.getTime() && sd < start.getTime()) {
        prevOrders++;
        if (counts) prevRev += total;
      }
    }

    // status mix
    const statusMap = new Map<string, number>();
    inRange.forEach((o) => {
      const s = (o.status || "pending").toLowerCase();
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const statusSegments = [...statusMap.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([label, value]) => ({ label, value, color: statusMeta(label).color }));

    // catalog
    const byType = (["Product", "Gift", "Souvenir"] as const).map((t) => {
      const list = items.filter((i) => i._type === t);
      return {
        type: t,
        count: list.length,
        units: list.reduce((s, i) => s + (i.ordersCount || 0), 0),
      };
    });
    const maxUnits = Math.max(...byType.map((b) => b.units), 1);

    const bestSellers = [...items]
      .sort((x, y) => (y.ordersCount || 0) - (x.ordersCount || 0))
      .slice(0, 6);
    const maxSold = Math.max(bestSellers[0]?.ordersCount || 0, 1);

    return {
      series,
      curRev,
      curOrders,
      prevRev,
      prevOrders,
      inRange,
      statusSegments,
      byType,
      maxUnits,
      bestSellers,
      maxSold,
    };
  }, [orders, items, range]);

  /* orders table ------------------------------------------------------ */
  const statuses = useMemo(
    () => ["all", ...Array.from(new Set(a.inRange.map((o) => (o.status || "pending").toLowerCase())))],
    [a.inRange]
  );

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return a.inRange
      .filter((o) => {
        const s = (o.status || "pending").toLowerCase();
        if (statusFilter !== "all" && s !== statusFilter) return false;
        if (!q) return true;
        return (
          (o.id || "").toLowerCase().includes(q) ||
          customerOf(o).toLowerCase().includes(q)
        );
      })
      .sort((x, y) =>
        sortBy === "amount"
          ? (y.total || 0) - (x.total || 0)
          : new Date(y.createdAt || 0).getTime() - new Date(x.createdAt || 0).getTime()
      );
  }, [a.inRange, search, statusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = tableRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => setPage(0), [search, statusFilter, sortBy, range]);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Order ID", "Date", "Customer", "Total", "Status"],
      ...tableRows.map((o) => [
        o.id || "",
        o.createdAt ? new Date(o.createdAt).toISOString() : "",
        customerOf(o),
        String(o.total || 0),
        o.status || "pending",
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-last-${range}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* derived ----------------------------------------------------------- */
  const revTrend = trendOf(a.curRev, a.prevRev);
  const ordTrend = trendOf(a.curOrders, a.prevOrders);
  const revSpark = a.series.map((d) => d.revenue);
  const ordSpark = a.series.map((d) => d.orders);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /* render ------------------------------------------------------------ */
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader text="Checking access..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            {greeting}. Here is how the store is doing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Date range"
            className="flex rounded-2xl bg-white border border-gray-100 shadow-sm p-1"
          >
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition ${
                  range === r
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r} days
              </button>
            ))}
          </div>

          <button
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition ${
              live
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {live && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  live ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </span>
            {live ? "Live" : "Go live"}
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {updatedAt && (
        <p className="-mt-5 text-xs text-gray-400">
          Updated {updatedAt.toLocaleTimeString()}
          {live && " · refreshing every 30 seconds"}
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Skeleton className="h-96 xl:col-span-2" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <KpiCard
              label="Total revenue"
              value={a.curRev}
              format={naira}
              icon={TrendingUp}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
              hex="#10b981"
              trend={revTrend}
              showTrend
              sub={`Last ${range} days vs previous ${range}`}
              spark={revSpark}
            />
            <KpiCard
              label="Total orders"
              value={a.curOrders}
              format={(n) => Math.round(n).toLocaleString()}
              icon={ShoppingCart}
              color="text-blue-600"
              bgColor="bg-blue-50"
              hex="#3b82f6"
              trend={ordTrend}
              showTrend
              sub={`${orders.length.toLocaleString()} orders all time`}
              spark={ordSpark}
            />
            <KpiCard
              label="Total products"
              value={items.length}
              format={(n) => Math.round(n).toLocaleString()}
              icon={Package}
              color="text-violet-600"
              bgColor="bg-violet-50"
              hex="#8b5cf6"
              sub={a.byType.map((b) => `${b.count} ${b.type.toLowerCase()}s`).join(", ")}
            >
              <div className="flex h-2 rounded-full overflow-hidden bg-violet-50">
                {a.byType.map((b, i) => (
                  <div
                    key={b.type}
                    style={{
                      width: `${items.length ? (b.count / items.length) * 100 : 0}%`,
                      background: ["#7c3aed", "#c084fc", "#f0abfc"][i],
                    }}
                    title={`${b.type}s: ${b.count}`}
                  />
                ))}
              </div>
            </KpiCard>
            <KpiCard
              label="Total users"
              value={userCount}
              format={(n) => Math.round(n).toLocaleString()}
              icon={Users}
              color="text-amber-600"
              bgColor="bg-amber-50"
              hex="#f59e0b"
              sub={
                userCount > 0
                  ? `${compactNaira(a.curRev / userCount)} revenue per user this period`
                  : "No registered users yet"
              }
            />
          </div>

          {/* Performance chart */}
          <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Performance</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {metric === "revenue" ? "Daily revenue" : "Daily orders"} over the last {range} days
                </p>
              </div>
              <div className="flex rounded-2xl bg-gray-50 p-1">
                {(["revenue", "orders"] as Metric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    aria-pressed={metric === m}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-xl capitalize transition ${
                      metric === m ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart series={a.series} metric={metric} />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Order status</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Last {range} days</p>
              <Donut segments={a.statusSegments} total={a.curOrders} />
            </div>

            <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Catalog performance</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Units sold by collection</p>
              <div className="space-y-5">
                {a.byType.map((b, i) => (
                  <div key={b.type}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-900">{b.type}s</span>
                      <span className="text-gray-500">
                        {b.units.toLocaleString()} sold · {b.count} listed
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(b.units / a.maxUnits) * 100}%`,
                          background: ["linear-gradient(90deg,#7c3aed,#9333ea)", "linear-gradient(90deg,#c026d3,#ec4899)", "linear-gradient(90deg,#f472b6,#fb7185)"][i],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders + top products */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent orders</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {tableRows.length} {tableRows.length === 1 ? "order" : "orders"} in the last {range} days
                  </p>
                </div>
                <button
                  onClick={exportCsv}
                  disabled={tableRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 transition"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by order ID or customer"
                    className="w-full rounded-2xl bg-gray-50 border border-transparent pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>
                <button
                  onClick={() => setSortBy((s) => (s === "date" ? "amount" : "date"))}
                  className="rounded-2xl bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition"
                >
                  Sort: {sortBy === "date" ? "Newest" : "Highest amount"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={statusFilter === s}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition ${
                      statusFilter === s
                        ? "bg-purple-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {pageRows.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pageRows.map((order, i) => {
                    const meta = statusMeta(order.status);
                    const who = customerOf(order);
                    return (
                      <div
                        key={order.id || i}
                        className="flex items-center justify-between py-4 text-sm hover:bg-gray-50/50 px-2 rounded transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            Order #{formatOrderNumber(order.orderNumber)}
                            {who && <span className="font-normal text-gray-500"> · {who}</span>}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "No date"}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 min-w-[100px] text-right">
                          {naira(order.total || 0)}
                        </p>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ml-4 capitalize ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>
                    {a.inRange.length === 0
                      ? "No orders in this period. Try a longer date range."
                      : "No orders match your filters."}
                  </p>
                </div>
              )}

              {tableRows.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 text-sm text-gray-500">
                  <span>
                    Page {safePage + 1} of {pageCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, safePage - 1))}
                      disabled={safePage === 0}
                      className="rounded-xl bg-gray-50 hover:bg-gray-100 p-2 disabled:opacity-40 transition"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                      disabled={safePage >= pageCount - 1}
                      className="rounded-xl bg-gray-50 hover:bg-gray-100 p-2 disabled:opacity-40 transition"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top products</h2>
              {a.bestSellers.length > 0 ? (
                <div className="space-y-4">
                  {a.bestSellers.map((product, index) => (
                    <div
                      key={product.id || index}
                      className="p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {index + 1}. {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {naira(product.price || 0)} · {product._type}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {(product.ordersCount || 0).toLocaleString()} sold
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-purple-600 to-pink-600 transition-all duration-700"
                          style={{ width: `${((product.ordersCount || 0) / a.maxSold) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No products yet. Add your first product to see rankings here.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}