import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  ChefHat,
  ClipboardList,
  KeyRound,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FoodImage,
  LoadingBlock,
  PageHeader,
  RefreshButton,
  SectionHeading,
  StatCard,
  StatusPill,
  resolveTone,
} from "@/components/admin";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.jsx";
import {
  useAdminDashboardStatsQuery,
  useAdminOrdersQuery,
  useFoodsQuery,
  useRushHourQuery,
  useToggleRushHourMutation,
} from "@/lib/api";
import { FOOD_HIGHLIGHTS, getFoodPhoto } from "@/lib/foodImages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Dunnkayce" }] }),
  component: AdminDashboardPage,
});

const moneyFormatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function formatMoney(value) {
  const amount = Number(value);
  return `₦${moneyFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getOrderId(order) {
  return String(order?._id ?? order?.id ?? "");
}

function getShortOrderId(order) {
  const id = getOrderId(order);
  return id ? `#${id.slice(-6).toUpperCase()}` : "#—";
}

function getCustomerName(order) {
  return order?.userId?.fullName || order?.user?.fullName || "Unknown customer";
}

function getItemCount(order) {
  return Array.isArray(order?.items) ? order.items.length : 0;
}

function getOrderStatus(order) {
  return String(order?.status || "Unknown");
}

function getStatusTone(status) {
  switch (status) {
    case "Delivered":
      return "fresh";
    case "Ready":
      return "blue";
    case "Preparing":
      return "gold";
    default:
      return "neutral";
  }
}

/** Last seven local calendar days, bucketed from paid orders only. */
function buildRevenueSeries(orders) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfToday);
    day.setDate(startOfToday.getDate() - (6 - index));
    return day;
  });

  const buckets = days.map((day) => ({
    key: day.getTime(),
    label: `${new Intl.DateTimeFormat("en-NG", { weekday: "short" }).format(day)} ${new Intl.DateTimeFormat("en-NG", { day: "numeric" }).format(day)}`,
    fullDate: new Intl.DateTimeFormat("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(day),
    revenue: 0,
    orders: 0,
  }));

  const bucketByDay = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  orders.forEach((order) => {
    const timestamp = new Date(order?.createdAt).getTime();
    if (!Number.isFinite(timestamp)) return;
    const day = new Date(timestamp);
    day.setHours(0, 0, 0, 0);
    const bucket = bucketByDay.get(day.getTime());
    if (!bucket) return;
    bucket.revenue += Number(order?.total) || 0;
    bucket.orders += 1;
  });

  return buckets;
}

/** Rank menu items by summed `items[].qty` across paid orders. */
function buildPopularItems(orders, foods) {
  const foodByName = new Map();
  foods.forEach((food) => {
    const name = String(food?.name ?? "").trim().toLowerCase();
    if (name && !foodByName.has(name)) foodByName.set(name, food);
  });

  const totals = new Map();
  orders.forEach((order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    items.forEach((item) => {
      const name = String(item?.name ?? "").trim() || "Unnamed item";
      const qty = Number(item?.qty) || 0;
      if (qty <= 0) return;
      const key = name.toLowerCase();
      const current = totals.get(key) ?? { name, qty: 0, lines: 0 };
      current.qty += qty;
      current.lines += 1;
      totals.set(key, current);
    });
  });

  return Array.from(totals.values())
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((entry) => {
      const food = foodByName.get(entry.name.toLowerCase());
      const uploadedImage = String(food?.imageUrl ?? "").trim();
      return {
        ...entry,
        category: food?.category || "Menu favourite",
        imageUrl:
          uploadedImage || getFoodPhoto({ name: entry.name, category: food?.category }),
      };
    });
}

function getRecentOrders(orders) {
  return [...orders]
    .sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    })
    .slice(0, 5);
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue (₦)",
    theme: { light: "var(--forest)", dark: "var(--fresh)" },
  },
  orders: {
    label: "Paid orders",
    theme: { light: "var(--fresh)", dark: "var(--gold)" },
  },
  average: {
    label: "Daily average",
    theme: { light: "var(--gold)", dark: "var(--gold)" },
  },
};

const heroFoods = FOOD_HIGHLIGHTS.slice(0, 3);

function AdminDashboardPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const dashboardStatsQuery = useAdminDashboardStatsQuery();
  const rushHourQuery = useRushHourQuery();
  const toggleRushHourMutation = useToggleRushHourMutation();
  const ordersQuery = useAdminOrdersQuery();
  const foodsQuery = useFoodsQuery();

  // -------------------------
  // AUTH CHECK
  // -------------------------
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    const stored = sessionStorage.getItem("admin");

    if (!token || !stored) {
      navigate({ to: "/adminlogin", replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object") {
        navigate({ to: "/adminlogin", replace: true });
        return;
      }
      setAdmin(parsed);
    } catch {
      navigate({ to: "/adminlogin", replace: true });
    }
  }, [navigate]);

  const paidOrders = useMemo(() => {
    const orders = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];
    return orders.filter((order) => order?.paymentStatus === "Paid");
  }, [ordersQuery.data]);

  const foods = useMemo(
    () => (Array.isArray(foodsQuery.data) ? foodsQuery.data : []),
    [foodsQuery.data],
  );

  const revenueSeries = useMemo(() => buildRevenueSeries(paidOrders), [paidOrders]);
  const popularItems = useMemo(() => buildPopularItems(paidOrders, foods), [paidOrders, foods]);
  const recentOrders = useMemo(() => getRecentOrders(paidOrders), [paidOrders]);

  const hasRecentRevenue = revenueSeries.some((day) => day.orders > 0);
  const sevenDayRevenue = revenueSeries.reduce((sum, day) => sum + day.revenue, 0);
  const dailyAverage = hasRecentRevenue ? Math.round(sevenDayRevenue / 7) : 0;

  const ordersLoading = ordersQuery.isPending;
  const ordersError = ordersQuery.isError;
  const ordersFetching = ordersQuery.isFetching;

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DunnkayceLoader
          variant="compact"
          label="Checking admin session"
          caption="Confirming your kitchen credentials."
        />
      </div>
    );
  }

  const adminName = admin.username ?? admin.email ?? "Admin";

  const stats = dashboardStatsQuery.data;
  const statsLoading = dashboardStatsQuery.isPending;
  const statsError = dashboardStatsQuery.isError;

  const rushHourLoading = rushHourQuery.isPending;
  const rushHourError = rushHourQuery.isError;
  const rushHourKnown = !rushHourLoading && !rushHourError;
  const rushHourActive = rushHourQuery.data === true;
  const rushHourBusy = toggleRushHourMutation.isPending || rushHourQuery.isFetching;

  const toggleRushHour = async () => {
    if (!rushHourKnown || rushHourBusy) return;
    const intended = !rushHourActive;
    try {
      await toggleRushHourMutation.mutateAsync({ status: intended });
      toast.success(intended ? "Rush hour enabled" : "Rush hour disabled");
    } catch {
      toast.error("Failed to update rush hour");
    }
  };

  const avgOrderValue =
    stats && stats.totalOrders > 0
      ? Math.round(stats.weeklyRevenue / stats.totalOrders)
      : null;

  const kpis = [
    {
      key: "students",
      title: "Students",
      subtitle: "Registered campus users",
      icon: Users,
      tone: "forest",
      value: stats ? (stats.totalStudents ?? 0).toLocaleString() : null,
    },
    {
      key: "orders",
      title: "Orders",
      subtitle: "Total orders placed",
      icon: ClipboardList,
      tone: "blue",
      value: stats ? (stats.totalOrders ?? 0).toLocaleString() : null,
    },
    {
      key: "paid-students",
      title: "Paid Students",
      subtitle: "Distinct students with at least one paid order",
      icon: UserCheck,
      tone: "violet",
      value: stats ? (stats.paidStudents ?? 0).toLocaleString() : null,
    },
    {
      key: "students-to-deliver",
      title: "Students To Deliver",
      subtitle: "Paid students with orders awaiting delivery",
      icon: Truck,
      tone: "gold",
      value: stats ? (stats.studentsToDelivery ?? 0).toLocaleString() : null,
    },
    {
      key: "revenue",
      title: "Weekly Revenue",
      subtitle: "This week's earnings",
      icon: Banknote,
      tone: "fresh",
      value: stats ? `₦${(stats.weeklyRevenue ?? 0).toLocaleString()}` : null,
    },
    ...(stats && (stats.totalOrders ?? 0) > 0
      ? [
          {
            key: "aov",
            title: "Avg. Order Value",
            subtitle: "Weekly revenue per order",
            icon: TrendingUp,
            tone: "gold",
            value: `₦${(avgOrderValue ?? 0).toLocaleString()}`,
          },
        ]
      : []),
  ];

  const quickLinks = [
    {
      label: "Food Management",
      path: "/admin-dashboard-food-management",
      description: "Curate the menu, pricing, and daily availability.",
      icon: ChefHat,
      tone: "forest",
    },
    {
      label: "Order Management",
      path: "/admin-dashboard-order-management",
      description: "Track live orders and keep fulfillment on pace.",
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Student Cart",
      path: "/admin-dashboard-student-cart",
      description: "Review active carts and spot checkout friction.",
      icon: ShoppingCart,
      tone: "gold",
    },
    {
      label: "Change Password",
      path: "/admin-dashboard-change-password",
      description:
        "Preview only — credential changes are not connected in this workspace.",
      icon: KeyRound,
      tone: "violet",
      isPreview: true,
    },
  ];

  return (
    <AdminShell
      eyebrow="Admin Command Center"
      title={`Welcome back, ${adminName}`}
      description="Monitor campus demand, steer kitchen throughput, and jump into the controls that keep Dunnkayce running smoothly."
    >
      <div className="space-y-8 pb-4">
        {/* PAGE INTRO + FOREST HERO */}
        <section aria-label="Operations overview" className="space-y-5">
          <PageHeader
            eyebrow="Operations overview"
            title="Command centre"
            description="A clear view of paid campus orders, kitchen demand, and the controls that keep service moving."
            actions={
              <>
                <StatusPill
                  tone={
                    rushHourKnown
                      ? rushHourActive
                        ? "gold"
                        : "fresh"
                      : "neutral"
                  }
                >
                  {rushHourKnown
                    ? rushHourActive
                      ? "Rush hour active"
                      : "Rush hour inactive"
                    : rushHourLoading
                      ? "Checking rush hour"
                      : "Rush hour unavailable"}
                </StatusPill>
                <RefreshButton
                  onClick={() => dashboardStatsQuery.refetch()}
                  isFetching={dashboardStatsQuery.isFetching}
                  label="Refresh metrics"
                />
              </>
            }
          />

          <div className="relative isolate overflow-hidden rounded-3xl border border-forest-deep/30 bg-forest-deep p-6 text-white shadow-lg sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background-image:radial-gradient(110%_130%_at_0%_0%,rgba(255,255,255,0.14),transparent_55%),linear-gradient(115deg,#062a1c_0%,#0b402b_58%,#12543a_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 hidden h-full w-[38%] items-center gap-3 overflow-hidden opacity-25 lg:flex"
            >
              {heroFoods.map((food) => (
                <FoodImage
                  key={food.name}
                  src={food.src}
                  alt=""
                  ratio="aspect-[4/3]"
                  className="w-24 shrink-0 border border-white/20 xl:w-28"
                />
              ))}
            </div>

            <div className="relative max-w-2xl space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
                <span aria-hidden="true" className="h-px w-6 bg-gold/70" />
                Service pulse
              </p>
              <h2 className="font-display text-3xl leading-tight tracking-wide text-white sm:text-4xl">
                Keep the kitchen moving.
              </h2>
              <p className="text-sm leading-6 text-emerald-50/80 sm:text-base">
                Revenue, demand, and fulfilment signals in one place. Figures are derived
                from the orders and operations APIs; the food photography is illustrative.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusPill tone="fresh" className="border-white/20 bg-white/10 text-emerald-50">
                  Paid-order data
                </StatusPill>
                <StatusPill tone="gold" className="border-gold/30 bg-gold/15 text-gold">
                  Forest-to-table operations
                </StatusPill>
              </div>
            </div>
          </div>
        </section>

        {/* RUSH HOUR COMMAND CENTRE */}
        <AdminPanel
          as="section"
          aria-label="Rush hour control"
          className={cn(
            "relative isolate overflow-hidden p-5 transition-colors sm:p-6",
            rushHourKnown && rushHourActive
              ? "border-warning/40 bg-gradient-to-br from-warning/10 via-card to-card"
              : "bg-card/90",
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border",
                  rushHourKnown && rushHourActive
                    ? "border-warning/40 bg-warning/20 text-amber-700 dark:text-amber-200"
                    : "border-border/70 bg-muted/50 text-muted-foreground",
                )}
              >
                <Zap aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
                    Rush Hour Control
                  </h2>
                  {rushHourLoading ? (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      Checking status…
                    </span>
                  ) : rushHourError ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                      <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
                      Status unavailable
                    </span>
                  ) : (
                    <StatusPill tone={rushHourActive ? "gold" : "neutral"}>
                      {rushHourActive ? "Active" : "Inactive"}
                    </StatusPill>
                  )}
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {rushHourLoading
                    ? "Syncing the current rush hour signal from operations."
                    : rushHourError
                      ? "We couldn't confirm the rush hour state. Retry to refresh the control."
                      : rushHourActive
                        ? "Peak mode is on. Keep prep lines tight and watch incoming order flow."
                        : "Peak mode is off. Enable it when demand surges to signal a rush period."}
                </p>
                {rushHourError ? (
                  <button
                    type="button"
                    onClick={() => rushHourQuery.refetch()}
                    disabled={rushHourQuery.isFetching}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                  >
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                    Retry status
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={toggleRushHour}
                disabled={!rushHourKnown || rushHourBusy}
                aria-pressed={rushHourKnown ? rushHourActive : undefined}
                aria-busy={rushHourBusy}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
                  rushHourKnown && rushHourActive
                    ? "border border-warning/40 bg-background text-foreground hover:bg-warning/10"
                    : "bg-primary text-primary-foreground hover:opacity-95",
                )}
              >
                <Zap aria-hidden="true" className="h-4 w-4" />
                {rushHourBusy
                  ? "Updating..."
                  : rushHourLoading
                    ? "Loading..."
                    : rushHourError
                      ? "Unavailable"
                      : rushHourActive
                        ? "Disable Rush Hour"
                        : "Enable Rush Hour"}
              </button>
              <p className="text-xs text-muted-foreground">
                {rushHourBusy ? "Applying change…" : "Updates kitchen rush-hour status"}
              </p>
            </div>
          </div>
        </AdminPanel>

        {/* KPI GRID */}
        <section aria-label="Key performance indicators" className="space-y-4">
          <SectionHeading
            eyebrow="Operations snapshot"
            title="Key metrics"
            description="Live counters from the admin operations feed."
            action={
              statsError ? (
                <RefreshButton
                  onClick={() => dashboardStatsQuery.refetch()}
                  label="Retry stats"
                />
              ) : null
            }
          />

          {statsError ? (
            <ErrorState
              title="Unable to load dashboard stats"
              description="Metrics may be temporarily unavailable. You can retry without leaving this page."
              onRetry={() => dashboardStatsQuery.refetch()}
              retryLabel="Retry stats"
            />
          ) : null}

          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              kpis.length > 4
                ? "xl:grid-cols-3"
                : kpis.length > 3
                  ? "xl:grid-cols-4"
                  : "xl:grid-cols-3",
            )}
          >
            {kpis.map((item) => (
              <StatCard
                key={item.key}
                label={item.title}
                hint={item.subtitle}
                icon={item.icon}
                tone={item.tone}
                isLoading={statsLoading}
                value={item.value ?? "—"}
                className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
              />
            ))}
          </div>
        </section>

        {/* REVENUE + POPULAR ITEMS */}
        <div className="grid min-w-0 gap-6 xl:grid-cols-5">
          <AdminPanel as="section" aria-label="Revenue from paid orders" className="min-w-0 p-5 sm:p-6 xl:col-span-3">
            <SectionHeading
              eyebrow="Revenue trend"
              title="Last 7 days"
              description="Daily collections from paid orders only."
              action={<StatusPill tone="fresh">From paid orders</StatusPill>}
            />

            <div className="mt-6">
              {ordersError ? (
                <ErrorState
                  title="Revenue unavailable"
                  description="We couldn't load the live orders feed. Retry to sync paid-order revenue."
                  onRetry={() => ordersQuery.refetch()}
                />
              ) : ordersLoading ? (
                <LoadingBlock
                  variant="table"
                  rows={7}
                  label="Loading paid-order revenue"
                  caption="Summing paid orders from the last seven days."
                />
              ) : !hasRecentRevenue ? (
                <EmptyState
                  icon={Banknote}
                  title="No paid orders in the last 7 days"
                  description="Revenue will appear here as soon as paid orders arrive. No values are estimated."
                />
              ) : (
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        7-day paid revenue
                      </p>
                      <p className="mt-1 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
                        {formatMoney(sevenDayRevenue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Daily average
                      </p>
                      <p className="mt-1 font-semibold tabular-nums text-foreground">
                        {formatMoney(dailyAverage)}
                      </p>
                    </div>
                  </div>

                  <ChartContainer
                    id="paid-revenue"
                    config={revenueChartConfig}
                    role="img"
                    aria-label="Revenue and paid order counts for each of the last seven days"
                    className="aspect-auto h-[260px] w-full min-w-0 sm:h-[300px]"
                  >
                    <ComposedChart data={revenueSeries} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dkRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        minTickGap={12}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        width={54}
                        tickFormatter={(value) =>
                          `₦${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`
                        }
                      />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <ChartTooltip
                        cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.fullDate ?? ""
                            }
                            formatter={(value, name, item) => (
                              <div className="flex w-full items-center justify-between gap-6">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <span
                                    aria-hidden="true"
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor:
                                        item?.dataKey === "revenue"
                                          ? "var(--color-revenue)"
                                          : "var(--color-orders)",
                                    }}
                                  />
                                  {name}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {item?.dataKey === "revenue"
                                    ? formatMoney(value)
                                    : Number(value).toLocaleString()}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <ReferenceLine
                        yAxisId="left"
                        y={dailyAverage}
                        stroke="var(--color-average)"
                        strokeDasharray="4 4"
                        label={{
                          value: "Avg",
                          position: "insideTopRight",
                          fill: "var(--color-average)",
                          fontSize: 10,
                        }}
                      />
                      <Area
                        yAxisId="left"
                        name="Revenue (₦)"
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={2.5}
                        fill="url(#dkRevenueFill)"
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-average)" }}
                      />
                      <Line
                        yAxisId="right"
                        name="Paid orders"
                        type="monotone"
                        dataKey="orders"
                        stroke="var(--color-orders)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ChartContainer>

                  <table className="sr-only">
                    <caption>Revenue and paid orders per day over the last seven days</caption>
                    <thead>
                      <tr>
                        <th scope="col">Day</th>
                        <th scope="col">Revenue</th>
                        <th scope="col">Paid orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueSeries.map((day) => (
                        <tr key={day.key}>
                          <th scope="row">{day.fullDate}</th>
                          <td>{formatMoney(day.revenue)}</td>
                          <td>{day.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Source: paid orders (<code>paymentStatus = Paid</code>) placed in the last
                    seven calendar days.
                  </p>
                </div>
              )}
            </div>
          </AdminPanel>

          <AdminPanel as="section" aria-label="Popular food items" className="min-w-0 p-5 sm:p-6 xl:col-span-2">
            <SectionHeading
              eyebrow="Kitchen demand"
              title="Popular items"
              description="Units sold, ranked by quantity."
              action={<StatusPill tone="fresh">From paid orders</StatusPill>}
            />

            <div className="mt-6">
              {ordersError ? (
                <ErrorState
                  title="Item demand unavailable"
                  description="Retry to sync paid-order items."
                  onRetry={() => ordersQuery.refetch()}
                />
              ) : ordersLoading ? (
                <LoadingBlock
                  variant="cards"
                  rows={4}
                  label="Loading popular food items"
                  caption="Summing quantities from paid orders."
                />
              ) : popularItems.length === 0 ? (
                <EmptyState
                  icon={ChefHat}
                  title="No item demand yet"
                  description="Rankings appear here once paid orders with items arrive."
                />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {popularItems.map((item, index) => (
                    <li
                      key={item.name.toLowerCase()}
                      className="min-w-0 rounded-2xl border border-border/70 bg-card/70 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
                    >
                      <div className="relative">
                        <FoodImage
                          src={item.imageUrl}
                          alt={item.name}
                          seed={item.name}
                          ratio="aspect-[4/3]"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-forest-deep/85 font-display text-sm text-white"
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="space-y-2 px-1 pb-1 pt-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate font-semibold text-foreground" title={item.name}>
                            {item.name}
                          </p>
                          <StatusPill tone="fresh" dot={false}>
                            {item.qty} sold
                          </StatusPill>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category} · {item.lines} paid order{item.lines === 1 ? "" : "s"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AdminPanel>
        </div>

        {/* RECENT PAID ORDERS */}
        <AdminPanel as="section" aria-label="Recent paid orders" className="min-w-0 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Order flow"
            title="Recent paid orders"
            description="The five newest paid orders from the live orders feed."
            action={
              <>
                <StatusPill tone="fresh">From paid orders</StatusPill>
                <RefreshButton
                  onClick={() => ordersQuery.refetch()}
                  isFetching={ordersFetching}
                  label="Refresh orders"
                />
              </>
            }
          />

          <div className="mt-6">
            {ordersError ? (
              <ErrorState
                title="Orders unavailable"
                description="We couldn't load recent paid orders. Retry to sync the feed."
                onRetry={() => ordersQuery.refetch()}
              />
            ) : ordersLoading ? (
              <LoadingBlock
                variant="rows"
                rows={5}
                label="Loading recent paid orders"
                caption="Fetching the newest paid orders."
              />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No paid orders yet"
                description="Paid orders will show up here as soon as students check out."
              />
            ) : (
              <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
                {recentOrders.map((order, index) => {
                  const status = getOrderStatus(order);
                  return (
                    <li
                      key={getOrderId(order) || `recent-order-${index}`}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <ClipboardList aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {getShortOrderId(order)} · {getCustomerName(order)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDateTime(order?.createdAt)} · {getItemCount(order)} item
                            {getItemCount(order) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <StatusPill tone={getStatusTone(status)}>{status}</StatusPill>
                        <span className="font-display text-xl text-foreground">
                          {formatMoney(order?.total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AdminPanel>

        {/* QUICK ACTIONS */}
        <section aria-label="Quick actions" className="space-y-4">
          <SectionHeading
            eyebrow="Quick actions"
            title="Jump to a workspace"
            description="One click to the tools you use most."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              const colors = resolveTone(item.tone);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", colors.icon)}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    {item.isPreview ? (
                      <StatusPill tone="gold" dot={false}>
                        Preview · not connected
                      </StatusPill>
                    ) : (
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-base font-semibold text-foreground">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
