"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ComponentType, MouseEvent, ReactNode, TouchEvent } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

declare module "react" {
  export function useId(): string;
}

export type Metric = "revenue" | "orders";

export interface DayPoint {
  date: Date;
  revenue: number;
  orders: number;
}

export const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export const compactNaira = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `₦${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `₦${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `₦${(n / 1e3).toFixed(1)}K`;
  return `₦${Math.round(n)}`;
};

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      from.current = target;
      return;
    }
    const begin = performance.now();
    const start = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - begin) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (target - start) * eased;
      setValue(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const id = useId().replace(/:/g, "");
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts: [number, number][] = values.map((v, i) => [
    n === 1 ? 50 : (i / (n - 1)) * 100,
    30 - (v / max) * 26,
  ]);
  const line = smoothPath(pts);
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="w-full h-10"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {line && (
        <>
          <path d={`${line} L100,32 L0,32 Z`} fill={`url(#${id})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null)
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
        New
      </span>
    );
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
      }`}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-3xl bg-gray-100 ${className}`} />
  );
}

interface KpiProps {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hex: string;
  trend?: number | null;
  showTrend?: boolean;
  sub: string;
  spark?: number[];
  children?: ReactNode;
}

export function KpiCard({
  label,
  value,
  format,
  icon: Icon,
  color,
  bgColor,
  hex,
  trend = 0,
  showTrend = false,
  sub,
  spark,
  children,
}: KpiProps) {
  const animated = useCountUp(value);
  return (
    <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <div className={`${bgColor} rounded-2xl p-3`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 mb-1">
        <p className={`text-3xl font-bold ${color}`}>{format(animated)}</p>
        {showTrend && <TrendBadge value={trend} />}
      </div>
      <p className="text-xs text-gray-500 mb-3">{sub}</p>
      <div className="mt-auto">
        {spark && spark.length > 1 && <Sparkline values={spark} color={hex} />}
        {children}
      </div>
    </div>
  );
}

export function AreaChart({
  series,
  metric,
}: {
  series: DayPoint[];
  metric: Metric;
}) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const W = 1000;
  const H = 300;
  const values = series.map((d) => d[metric]);
  const max = Math.max(...values, 1) * 1.15;
  const n = series.length;
  const pts: [number, number][] = values.map((v, i) => [
    n === 1 ? W / 2 : (i / (n - 1)) * W,
    H - (v / max) * (H - 20) - 10,
  ]);
  const line = smoothPath(pts);

  const fmt = (v: number) =>
    metric === "revenue" ? compactNaira(v) : String(Math.round(v));
  const fmtFull = (v: number) =>
    metric === "revenue" ? naira(v) : `${v} orders`;

  const onMove = (e: MouseEvent | TouchEvent) => {
    const el = wrap.current;
    if (!el || n < 2) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (n - 1)));
  };

  const hp = hover !== null ? pts[hover] : null;
  const hd = hover !== null ? series[hover] : null;
  const leftPct = hp ? (hp[0] / W) * 100 : 0;
  const topPct = hp ? (hp[1] / H) * 100 : 0;

  const ticks = [0.25, 0.5, 0.75, 1];
  const peak = max / 1.15;
  const tickY = (t: number) => H - ((t * peak) / max) * (H - 20) - 10;

  return (
    <div className="flex gap-3">
      <div className="relative w-12 shrink-0 text-right text-[11px] text-gray-400 h-72">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: `${(tickY(t) / H) * 100}%` }}
          >
            {fmt(peak * t)}
          </span>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <div
          ref={wrap}
          className="relative h-72 touch-pan-y select-none"
          onMouseMove={onMove}
          onTouchMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            role="img"
            aria-label={`${metric} over time`}
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#ec4899" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {ticks.map((t) => {
              const y = tickY(t);
              return (
                <line
                  key={t}
                  x1="0"
                  x2={W}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {line && (
              <>
                <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id}-fill)`} />
                <path
                  d={line}
                  fill="none"
                  stroke={`url(#${id}-stroke)`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
            {hp && (
              <line
                x1={hp[0]}
                x2={hp[0]}
                y1="0"
                y2={H}
                stroke="#c4b5fd"
                strokeDasharray="4 4"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {hp && hd && (
            <>
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-white border-[3px] border-fuchsia-500 shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              />
              <div
                className="absolute z-10 pointer-events-none rounded-2xl bg-gray-900 text-white px-3 py-2 text-xs shadow-lg whitespace-nowrap"
                style={{
                  left: `${Math.min(86, Math.max(14, leftPct))}%`,
                  top: `${Math.max(0, topPct - 22)}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <p className="text-gray-300">
                  {hd.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="font-semibold">{fmtFull(hd[metric])}</p>
                <p className="text-gray-400">
                  {metric === "revenue" ? `${hd.orders} orders` : naira(hd.revenue)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-2 text-[11px] text-gray-400">
          {[0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
            <span key={k}>
              {series[i]?.date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Donut({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const r = 42;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * C;
              const el = (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${C - Math.max(0, len - 1.5)}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">orders</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm flex-1 min-w-0">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-gray-600 capitalize truncate">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold text-gray-900">{s.value}</span>
          </li>
        ))}
        {segments.length === 0 && <li className="text-gray-400">No orders in this period</li>}
      </ul>
    </div>
  );
}
