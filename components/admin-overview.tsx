"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  IndianRupee,
  MapPin,
  Minus,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminAnalytics } from "@/lib/admin.actions";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

/** Legible in both light and dark themes since it uses design tokens. */
const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12,
  borderRadius: 10,
  background: "var(--popover)",
  border: "1px solid var(--border)",
  color: "var(--popover-foreground)",
  boxShadow: "var(--shadow-soft)",
};
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: "var(--popover-foreground)" };
const TOOLTIP_ITEM_STYLE: React.CSSProperties = { color: "var(--popover-foreground)" };

/** Turns any row set into a downloadable CSV without a dependency. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaChip({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus width={11} height={11} /> new
      </span>
    );
  }
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        flat && "bg-muted text-muted-foreground",
        up && "bg-success/12 text-success",
        !up && !flat && "bg-destructive/12 text-destructive",
      )}
    >
      {flat ? (
        <Minus width={11} height={11} />
      ) : up ? (
        <ArrowUpRight width={11} height={11} />
      ) : (
        <ArrowDownRight width={11} height={11} />
      )}
      {Math.abs(value)}%
    </span>
  );
}

/** Tiny inline trend line for the KPI tiles. */
function Sparkline({
  data,
  dataKey,
  color = "var(--primary)",
}: {
  data: any[];
  dataKey: "revenue" | "orders";
  color?: string;
}) {
  if (data.length === 0) return null;
  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  hint,
  spark,
  sparkKey,
  sparkColor,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  spark?: any[];
  sparkKey?: "revenue" | "orders";
  sparkColor?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon width={18} height={18} strokeWidth={1.6} />
        </span>
        {delta !== undefined ? <DeltaChip value={delta} /> : null}
      </div>
      <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      {spark && sparkKey ? (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark} dataKey={sparkKey} color={sparkColor} />
        </div>
      ) : hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  action,
  isEmpty,
  emptyLabel = "No data in the last 30 days yet.",
  bodyClassName,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  isEmpty?: boolean;
  emptyLabel?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-eyebrow text-muted-foreground">{title}</h3>
        {action}
      </div>
      <div className={cn("mt-4", bodyClassName)}>
        {isEmpty ? (
          <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function RangeToggle({
  range,
  onChange,
}: {
  range: 7 | 30;
  onChange: (value: 7 | 30) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {([7, 30] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            range === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}d
        </button>
      ))}
    </div>
  );
}

export function AdminOverview({
  orders,
  subscribers,
  products,
}: {
  orders: any[];
  subscribers: any[];
  products: any[];
}) {
  // The analytics roll-up is expensive, so it's fetched separately from the
  // admin page's server render and cached by SWR (replacing react-query).
  const {
    data,
    error,
    isLoading,
    isValidating: isFetching,
    mutate: refetch,
  } = useSWR("admin-analytics", () => getAdminAnalytics(), {
    revalidateOnFocus: false,
    dedupingInterval: 60 * 1000,
    errorRetryCount: 1,
  });
  const isError = Boolean(error);

  const [range, setRange] = useState<7 | 30>(30);

  const daily = useMemo(
    () =>
      (data?.daily ?? []).map((row) => ({
        ...row,
        label: new Date(row.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      })),
    [data],
  );

  const trend = useMemo(() => (range === 7 ? daily.slice(-7) : daily), [daily, range]);

  // Momentum for the selected window vs the equivalent window before it.
  const momentum = useMemo(() => {
    const span = range;
    const current = daily.slice(-span);
    const previous = daily.slice(-span * 2, -span);
    const sum = (rows: typeof daily, key: "revenue" | "orders") =>
      rows.reduce((total, row) => total + (row[key] ?? 0), 0);
    return {
      revenue: pctChange(sum(current, "revenue"), sum(previous, "revenue")),
      orders: pctChange(sum(current, "orders"), sum(previous, "orders")),
      revenueTotal: sum(current, "revenue"),
      orderTotal: sum(current, "orders"),
    };
  }, [daily, range]);

  const lowStock = products
    .filter((product) => product.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  const maxProductRevenue = Math.max(1, ...(data?.topProducts ?? []).map((p) => p.revenue));
  const maxCity = Math.max(1, ...(data?.topCities ?? []).map((c) => c.value));
  const paymentTotal = (data?.paymentMix ?? []).reduce((sum, entry) => sum + entry.value, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-44 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <h3 className="font-display text-xl">Analytics couldn&apos;t load</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error | undefined)?.message ??
            "We couldn't fetch the analytics for the last 30 days."}
        </p>
        <Button className="mt-5" variant="outline" disabled={isFetching} onClick={() => refetch()}>
          {isFetching ? "Retrying…" : "Retry"}
        </Button>
      </div>
    );
  }

  const rangeLabel = range === 7 ? "last 7 days" : "last 30 days";

  const exportButtons = (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          downloadCsv(
            `mehr-orders-${new Date().toISOString().slice(0, 10)}.csv`,
            orders.map((order) => ({
              order_number: order.order_number,
              date: order.created_at,
              customer: order.full_name,
              email: order.email,
              city: order.city,
              state: order.state,
              status: order.status,
              payment: order.payment_method,
              total: order.total,
            })),
          )
        }
      >
        <Download width={14} height={14} /> Orders
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          downloadCsv(
            `mehr-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
            subscribers.map((row) => ({ email: row.email, joined: row.created_at })),
          )
        }
      >
        <Download width={14} height={14} /> Subscribers
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          downloadCsv(
            `mehr-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
            products.map((product) => ({
              sku: product.slug,
              name: product.name,
              category: product.category_slug,
              price: product.price,
              stock: product.stock,
              rating: product.rating,
            })),
          )
        }
      >
        <Download width={14} height={14} /> Inventory
      </Button>
    </div>
  );

  const noActivity = data.totals.orders === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Performance</h2>
          <p className="text-sm text-muted-foreground">
            A snapshot of revenue, orders and fulfilment over the {rangeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeToggle range={range} onChange={setRange} />
          {exportButtons}
        </div>
      </div>

      {/* Spotlight: revenue trend + payment mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow text-muted-foreground">Revenue · {rangeLabel}</p>
              <div className="mt-2 flex items-end gap-3">
                <p className="font-display text-4xl leading-none">
                  {formatINR(momentum.revenueTotal)}
                </p>
                <DeltaChip value={momentum.revenue} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {momentum.orderTotal} orders · avg {formatINR(data.totals.aov)} per order
              </p>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <IndianRupee width={20} height={20} strokeWidth={1.6} />
            </span>
          </div>
          <div className="mt-5 h-[240px]">
            {noActivity ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue in the {rangeLabel} yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -16, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval={range === 7 ? 0 : 4}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={54}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatINR(value), "Revenue"]}
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    cursor={{ stroke: "var(--border)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#revFill)"
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <Panel title="Payment mix" isEmpty={data.paymentMix.length === 0} bodyClassName="h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.paymentMix}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={2}
                animationDuration={500}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.paymentMix.map((entry, index) => (
                  <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} orders`, name]}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-x-0 top-[92px] flex flex-col items-center">
            <span className="font-display text-2xl leading-none">{paymentTotal}</span>
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">orders</span>
          </div>
          <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.paymentMix.map((entry, index) => (
              <li key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }}
                />
                {entry.name.toUpperCase()} · {entry.value}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* KPI tiles with mini trends */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={IndianRupee}
          label="Revenue"
          value={formatINR(momentum.revenueTotal)}
          delta={momentum.revenue}
          spark={trend}
          sparkKey="revenue"
          sparkColor="var(--primary)"
        />
        <KpiTile
          icon={ShoppingBag}
          label="Orders"
          value={String(momentum.orderTotal)}
          delta={momentum.orders}
          spark={trend}
          sparkKey="orders"
          sparkColor="var(--chart-3)"
        />
        <KpiTile
          icon={TrendingUp}
          label="Average order"
          value={formatINR(data.totals.aov)}
          hint="Revenue ÷ orders (30d)"
        />
        <KpiTile
          icon={Users}
          label="Customers"
          value={String(data.totals.customers)}
          hint="Unique buyers (30d)"
        />
      </div>

      {/* Best sellers + status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Best sellers by revenue"
          isEmpty={data.topProducts.length === 0}
          bodyClassName="space-y-3"
        >
          {data.topProducts.map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm">{item.name}</span>
                  <span className="shrink-0 text-sm font-medium">{formatINR(item.revenue)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(item.revenue / maxProductRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {item.units} sold
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Panel>

        <Panel
          title="Orders by status"
          isEmpty={data.statusBreakdown.length === 0}
          bodyClassName="space-y-2.5"
        >
          {data.statusBreakdown.map((entry) => {
            const total = data.statusBreakdown.reduce((sum, row) => sum + row.value, 0) || 1;
            return (
              <div key={entry.name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm capitalize">
                  {entry.name.replace(/_/g, " ")}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(entry.value / total) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-medium">{entry.value}</span>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* Restock + cities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Restock soon">
          {lowStock.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageX width={16} height={16} /> Every piece is comfortably in stock.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {lowStock.slice(0, 8).map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{product.name}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      product.stock === 0
                        ? "bg-destructive/12 text-destructive"
                        : "bg-gold/15 text-gold-foreground",
                    )}
                  >
                    {product.stock === 0 ? "Sold out" : `${product.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Where orders ship"
          isEmpty={data.topCities.length === 0}
          emptyLabel="No orders in the last 30 days."
          bodyClassName="space-y-2.5"
        >
          {data.topCities.map((city) => (
            <div key={city.name} className="flex items-center gap-3">
              <MapPin width={14} height={14} className="shrink-0 text-muted-foreground" />
              <span className="w-28 shrink-0 truncate text-sm">{city.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-3"
                  style={{ width: `${(city.value / maxCity) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium">{city.value}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
