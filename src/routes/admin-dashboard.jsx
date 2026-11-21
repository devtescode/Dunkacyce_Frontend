import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import {
  useAdminDashboardStatsQuery,
  useRushHourQuery,
  useToggleRushHourMutation,
} from "@/lib/api";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Dunnkayce" }] }),
  component: AdminDashboardPage,
});

function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-muted/70 motion-reduce:animate-none ${className}`}
    />
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const dashboardStatsQuery = useAdminDashboardStatsQuery();
  const rushHourQuery = useRushHourQuery();
  const toggleRushHourMutation = useToggleRushHourMutation();

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
      setAdmin(parsed);
    } catch {
      navigate({ to: "/adminlogin", replace: true });
    }
  }, [navigate]);

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
  const rushHourBusy = toggleRushHourMutation.isPending;

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
      accent: "bg-primary/10 text-primary",
      value: stats ? (stats.totalStudents ?? 0).toLocaleString() : null,
    },
    {
      key: "orders",
      title: "Orders",
      subtitle: "Total orders placed",
      icon: ClipboardList,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      value: stats ? (stats.totalOrders ?? 0).toLocaleString() : null,
    },
    {
      key: "paid-students",
      title: "Paid Students",
      subtitle: "Distinct students with at least one paid order",
      icon: UserCheck,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      value: stats ? (stats.paidStudents ?? 0).toLocaleString() : null,
    },
    {
      key: "students-to-deliver",
      title: "Students To Deliver",
      subtitle: "Paid students with orders awaiting delivery",
      icon: Truck,
      accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      value: stats ? (stats.studentsToDelivery ?? 0).toLocaleString() : null,
    },
    {
      key: "revenue",
      title: "Weekly Revenue",
      subtitle: "This week's earnings",
      icon: Banknote,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      value: stats ? `₦${(stats.weeklyRevenue ?? 0).toLocaleString()}` : null,
    },
    ...(stats && (stats.totalOrders ?? 0) > 0
      ? [
          {
            key: "aov",
            title: "Avg. Order Value",
            subtitle: "Weekly revenue per order",
            icon: TrendingUp,
            accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Order Management",
      path: "/admin-dashboard-order-management",
      description: "Track live orders and keep fulfillment on pace.",
      icon: ClipboardList,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Student Cart",
      path: "/admin-dashboard-student-cart",
      description: "Review active carts and spot checkout friction.",
      icon: ShoppingCart,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Change Password",
      path: "/admin-dashboard-change-password",
      description: "Update admin credentials and secure access.",
      icon: KeyRound,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <AdminShell
      eyebrow="Admin Command Center"
      title={`Welcome back, ${adminName}`}
      description="Monitor campus demand, steer kitchen throughput, and jump into the controls that keep Dunnkayce running smoothly."
    >
      <div className="space-y-6">
        {/* RUSH HOUR COMMAND STRIP */}
        <section
          className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-colors sm:p-6 ${
            rushHourKnown && rushHourActive
              ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card"
              : "border-border/70 bg-card"
          }`}
          aria-label="Rush hour control"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${
                  rushHourKnown && rushHourActive
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "border-border/70 bg-muted/50 text-muted-foreground"
                }`}
              >
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-2">
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
                      <AlertCircle className="h-3.5 w-3.5" />
                      Status unavailable
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        rushHourActive
                          ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300"
                          : "bg-muted text-muted-foreground ring-1 ring-border/70"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          rushHourActive ? "bg-amber-500" : "bg-muted-foreground/60"
                        }`}
                        aria-hidden="true"
                      />
                      {rushHourActive ? "Active" : "Inactive"}
                    </span>
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
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-accent motion-reduce:transition-none"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
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
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${
                  rushHourKnown && rushHourActive
                    ? "border border-amber-500/30 bg-background text-foreground hover:bg-amber-500/10"
                    : "bg-primary text-primary-foreground hover:opacity-95"
                }`}
              >
                <Zap className="h-4 w-4" />
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
        </section>

        {/* STATS OVERVIEW */}
        <section aria-label="Key performance indicators" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Operations snapshot
              </p>
              <h2 className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
                Key metrics
              </h2>
            </div>
            {statsError ? (
              <button
                type="button"
                onClick={() => dashboardStatsQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent motion-reduce:transition-none"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            ) : null}
          </div>

          {statsError ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load dashboard stats</p>
                <p className="mt-1 text-destructive/80">
                  Metrics may be temporarily unavailable. You can retry without leaving this page.
                </p>
              </div>
            </div>
          ) : null}

          <div
            className={`grid gap-4 sm:grid-cols-2 ${
              kpis.length > 4
                ? "xl:grid-cols-3"
                : kpis.length > 3
                  ? "xl:grid-cols-4"
                  : "xl:grid-cols-3"
            }`}
          >
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.key}
                  className="group rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.title}
                      </p>
                      <div className="mt-4 min-h-[2.25rem]">
                        {statsLoading ? (
                          <Skeleton className="h-9 w-28" />
                        ) : item.value != null ? (
                          <p className="text-3xl font-semibold tracking-tight text-foreground">
                            {item.value}
                          </p>
                        ) : (
                          <p className="text-3xl font-semibold tracking-tight text-muted-foreground">
                            —
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.subtitle}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section aria-label="Quick actions" className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Quick actions
            </p>
            <h2 className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
              Jump to a workspace
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="mt-1 h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:transform-none" />
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