import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Bike,
  CalendarClock,
  CheckCircle2,
  ChefHat,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getSessionUser } from "@/lib/session";
import { queryKeys, useUserOrdersQuery } from "@/lib/api";
import { getUserSocket, ORDER_STATUS_EVENTS } from "@/lib/socket";
import {
  DEFAULT_ETA_MINUTES,
  FULFILLMENT_STATUSES,
  formatOrderDateTime,
  getDeliveredAt,
  getEtaDeadline,
  getReadyAt,
  normalizeStatus,
  useCountdown,
} from "@/lib/orderTracking";
import { formatNGN } from "@/lib/store";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — DUNNKAYCE" }] }),
  component: OrdersPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
];

const TRACKER_STEPS = [
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: PackageCheck },
  { key: "on-the-way", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

// Canonical names published by the tracking helper, with defensive fallbacks
// so status mapping keeps working if the backend sends a synonym.
const FULFILLMENT_STATUS_NAMES = (Array.isArray(FULFILLMENT_STATUSES) ? FULFILLMENT_STATUSES : [])
  .map((entry) =>
    typeof entry === "string" ? entry : (entry?.key ?? entry?.status ?? entry?.label ?? entry?.id),
  )
  .filter(Boolean)
  .map((name) => String(name).toLowerCase());

function statusKey(status) {
  const value = String(status ?? "").toLowerCase();
  const compact = value.replace(/[^a-z0-9]+/g, "");

  if (FULFILLMENT_STATUS_NAMES.some((name) => value.includes(name)) && value.includes("deliver")) {
    return "delivered";
  }
  if (compact.includes("cancel") || compact.includes("failed")) {
    return "cancelled";
  }
  if (compact.includes("deliver")) return "delivered";
  if (FULFILLMENT_STATUS_NAMES.some((name) => name.includes("ready")) && value.includes("ready")) {
    return "ready";
  }
  if (compact.includes("ready")) return "ready";
  if (
    compact.includes("way") ||
    compact.includes("transit") ||
    compact.includes("dispatch") ||
    compact.includes("rider")
  ) {
    return "on-the-way";
  }
  return "preparing";
}

function shortId(order) {
  return (
    String(order?._id ?? order?.id ?? "")
      .slice(-6)
      .toUpperCase() || "ORDER"
  );
}

function toMillis(value) {
  if (value == null) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function dateTimeAttr(value) {
  const date = toMillis(value) ? new Date(toMillis(value)) : null;
  return date ? date.toISOString() : undefined;
}

function isPaid(paymentStatus) {
  const value = String(paymentStatus ?? "").toLowerCase();
  return value === "paid" || value.includes("success") || value.includes("completed");
}

function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => getSessionUser());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const ordersQuery = useUserOrdersQuery(user?.id);
  const orders = ordersQuery.data ?? [];

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) setUser(sessionUser);
      else navigate({ to: "/login", replace: true });
    }
  }, [user, navigate]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => toMillis(b.updatedAt ?? b.createdAt) - toMillis(a.updatedAt ?? a.createdAt),
      ),
    [orders],
  );

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        const key = statusKey(normalizeStatus(order));
        return key !== "delivered" && key !== "cancelled";
      }),
    [orders],
  );

  const mostRecentDelivered = useMemo(
    () =>
      orders
        .filter((order) => statusKey(normalizeStatus(order)) === "delivered")
        .sort((a, b) => toMillis(getDeliveredAt(b)) - toMillis(getDeliveredAt(a)))[0] ?? null,
    [orders],
  );

  const spotlightOrder = useMemo(() => {
    if (!activeOrders.length) return null;
    return [...activeOrders].sort((a, b) => {
      const aKey = statusKey(normalizeStatus(a));
      const bKey = statusKey(normalizeStatus(b));
      const aReady = aKey === "ready" || aKey === "on-the-way" ? 1 : 0;
      const bReady = bKey === "ready" || bKey === "on-the-way" ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      return toMillis(b.updatedAt ?? b.createdAt) - toMillis(a.updatedAt ?? a.createdAt);
    })[0];
  }, [activeOrders]);

  const spotlightStatus = spotlightOrder ? normalizeStatus(spotlightOrder) : null;
  const spotlightCountdown = useCountdown(spotlightOrder ? getEtaDeadline(spotlightOrder) : null);

  // Poll only while something is still moving; socket events invalidate at once.
  useEffect(() => {
    if (!user?.id || activeOrders.length === 0) return undefined;
    const intervalId = window.setInterval(() => {
      ordersQuery.refetch();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [activeOrders.length, user?.id, ordersQuery.refetch]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = getUserSocket();
    if (!socket) return undefined;

    const seen = new Set();
    const handleStatusEvent = (payload) => {
      const eventUserIds = [
        payload?.userId,
        payload?.order?.userId,
        payload?.user?.id,
        payload?.user,
        payload?.order?.user?.id,
        payload?.order?.user,
      ]
        .filter((value) => value !== undefined && value !== null && typeof value !== "object")
        .map(String);
      // Accept the event when any user id in the payload matches this session.
      if (eventUserIds.length > 0 && !eventUserIds.some((id) => id === String(user.id))) {
        return;
      }

      const status = payload?.status ?? payload?.order?.status ?? "updated";
      const orderId =
        payload?.orderId ??
        payload?.order?._id ??
        payload?.order?.id ??
        payload?.reference ??
        payload?.order?.reference;
      const dedupeKey = `${orderId ?? "unknown"}:${status}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.user(user.id),
      });

      const key = statusKey(status);
      if (key === "ready") {
        toast.success("Your order is ready! It will reach you in about 8 minutes.");
      } else if (key === "delivered") {
        toast.success("Your order has been delivered. Enjoy!");
      } else if (key === "preparing") {
        toast("Your order is being prepared.");
      } else {
        toast("Your order was updated.");
      }
    };

    for (const event of ORDER_STATUS_EVENTS) {
      socket.on(event, handleStatusEvent);
    }
    return () => {
      for (const event of ORDER_STATUS_EVENTS) {
        socket.off(event, handleStatusEvent);
      }
    };
  }, [user?.id, queryClient]);

  const matchingOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedOrders.filter((order) => {
      const key = statusKey(normalizeStatus(order));
      if (filter === "in-progress" && key === "delivered") return false;
      if (filter === "ready" && key !== "ready" && key !== "on-the-way") {
        return false;
      }
      if (filter === "delivered" && key !== "delivered") return false;
      if (!query) return true;

      const haystack = [
        shortId(order),
        order._id,
        order.reference,
        order.hostel,
        order.room,
        ...(Array.isArray(order.items)
          ? order.items.map((item) => `${item.name ?? ""} ${item.soupType ?? ""}`)
          : []),
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [sortedOrders, search, filter]);

  const stats = useMemo(() => {
    const delivered = orders.filter(
      (order) => statusKey(normalizeStatus(order)) === "delivered",
    ).length;
    const spent = orders
      .filter((order) => isPaid(order.paymentStatus))
      .reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    return { active: activeOrders.length, delivered, spent };
  }, [orders, activeOrders.length]);

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-deep via-forest to-fresh/80 p-6 text-white shadow-xl shadow-forest/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-fresh/25 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
              Live order tracking
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your orders, on the move.
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Follow every step from the kitchen to your hostel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-60 motion-reduce:transition-none"
          >
            <RotateCcw
              aria-hidden="true"
              className={cn(
                "h-4 w-4",
                ordersQuery.isFetching &&
                  "animate-[dk-spin_1s_linear_infinite] motion-reduce:animate-none",
              )}
            />
            {ordersQuery.isFetching ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={BellRing}
            label="Active orders"
            value={stats.active}
            hint="On the move right now"
          />
          <StatTile
            icon={CheckCircle2}
            label="Delivered"
            value={stats.delivered}
            hint="Happily received"
          />
          <StatTile
            icon={ReceiptText}
            label="Total spent"
            value={formatNGN(stats.spent)}
            hint="Across successful payments"
          />
        </div>
      </section>

      {ordersQuery.isPending ? (
        <div className="rounded-[2rem] border border-border bg-card p-8">
          <DunnkayceLoader
            variant="compact"
            label="Loading your orders"
            caption="Fetching your live order history."
          />
        </div>
      ) : ordersQuery.isError ? (
        <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-black tracking-tight">Could not load orders</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t reach the kitchen just now. Please try again.
          </p>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 motion-reduce:transition-none"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
            <UtensilsCrossed aria-hidden="true" className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight">No orders yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you place an order, you can follow it right here.
          </p>
          <Link
            to="/user-dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 motion-reduce:transition-none"
          >
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          {spotlightOrder ? (
            <Spotlight
              order={spotlightOrder}
              status={spotlightStatus}
              countdown={spotlightCountdown}
              etaMinutes={Number(spotlightOrder.etaMinutes) || DEFAULT_ETA_MINUTES}
            />
          ) : mostRecentDelivered ? (
            <DeliveredBanner order={mostRecentDelivered} />
          ) : null}

          <Toolbar
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            shown={matchingOrders.length}
            total={orders.length}
          />

          {matchingOrders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Search aria-hidden="true" className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight">No matching orders</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different search or clear the status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary motion-reduce:transition-none"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {matchingOrders.map((order) => (
                <OrderCard key={order._id ?? order.id} order={order} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-gold">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{label}</p>
        <p className="mt-0.5 text-xl font-black tracking-tight tabular-nums text-white">{value}</p>
        {hint ? <p className="text-[11px] text-white/60">{hint}</p> : null}
      </div>
    </div>
  );
}

function Toolbar({ search, onSearchChange, filter, onFilterChange, shown, total }) {
  return (
    <section
      aria-label="Order search and filters"
      className="rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search ID, hostel, room or meal"
            className="h-11 w-full rounded-2xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div
          role="group"
          aria-label="Filter orders by status"
          className="flex flex-wrap items-center gap-2"
        >
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => onFilterChange(option.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition motion-reduce:transition-none",
                filter === option.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Showing <span className="font-black tabular-nums text-foreground">{shown}</span> of{" "}
        <span className="font-bold tabular-nums text-foreground">{total}</span> orders
      </p>
    </section>
  );
}

function Spotlight({ order, status, countdown, etaMinutes }) {
  const key = statusKey(status);
  const isReady = key === "ready" || key === "on-the-way";
  const isOnTheWay = key === "on-the-way" || (isReady && countdown.isExpired);
  const hasDeadline = getEtaDeadline(order) != null;
  const progress = hasDeadline
    ? Math.min(
        100,
        Math.max(0, 100 - (Number(countdown.totalMs ?? 0) / (etaMinutes * 60000)) * 100),
      )
    : 0;
  const hostel = order.hostel || "your hostel";
  const room = order.room || "—";

  return (
    <section
      aria-label="Live order status"
      className="relative overflow-hidden rounded-[2rem] border border-fresh/25 bg-gradient-to-br from-card via-card to-secondary p-6 shadow-lg shadow-forest/5 sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              isReady
                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                : "bg-gold/20 text-forest dark:text-gold",
            )}
          >
            {isReady ? (
              <Bike aria-hidden="true" className="h-7 w-7" />
            ) : (
              <BellRing aria-hidden="true" className="h-7 w-7" />
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Right now</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {isReady ? (isOnTheWay ? "On the way to you" : "Ready — on the way") : "Preparing"}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
              {hostel} · Room {room}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 lg:text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Tracking order
          </p>
          <p className="font-black tabular-nums text-foreground">#{shortId(order)}</p>
        </div>
      </div>

      <div className="mt-8">
        <StatusTracker status={status} onTheWay={isOnTheWay} />
      </div>

      <div
        aria-live="polite"
        className="mt-8 rounded-[1.5rem] border border-border bg-card p-5 sm:p-6"
      >
        {isReady ? (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  Arrival countdown
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight tabular-nums text-foreground sm:text-6xl">
                  {!hasDeadline
                    ? "On the way"
                    : countdown.isExpired
                      ? "Almost there"
                      : countdown.label}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {!hasDeadline
                    ? "Your arrival time is being confirmed — stay close."
                    : countdown.isExpired
                      ? "Arriving shortly — our rider is almost there."
                      : `until your order reaches ${hostel} · Room ${room}`}
                </p>
              </div>
              <div className="sm:max-w-xs sm:text-right">
                <p className="text-sm font-black tracking-tight text-foreground">
                  Keep your phone close — we&apos;re on our way.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your food will arrive in the next {etaMinutes} minutes.
                </p>
              </div>
            </div>
            <div
              role="progressbar"
              aria-label="Delivery progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-valuetext={`${Math.round(progress)}% of the estimated arrival window elapsed`}
              className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-fresh via-primary to-gold transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-forest dark:text-gold">
              <Clock3
                aria-hidden="true"
                className="h-6 w-6 animate-[dk-pulse-soft_2s_ease-in-out_infinite] motion-reduce:animate-none"
              />
            </div>
            <div>
              <p className="text-base font-black tracking-tight sm:text-lg">
                The kitchen is preparing your meal.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your {DEFAULT_ETA_MINUTES}-minute arrival countdown starts the moment it&apos;s
                marked Ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DeliveredBanner({ order }) {
  const deliveredAt = getDeliveredAt(order);
  return (
    <section
      aria-label="Delivery confirmation"
      className="flex flex-col gap-4 rounded-[2rem] border border-success/25 bg-gradient-to-br from-secondary via-card to-card p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
          <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-success">
            All caught up
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Your last order was delivered.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            #{shortId(order)} · {order.hostel || "Hostel"} · Room {order.room || "—"}
          </p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <CalendarClock aria-hidden="true" className="h-4 w-4 text-primary" />
        Delivered on{" "}
        <time dateTime={dateTimeAttr(deliveredAt)}>{formatOrderDateTime(deliveredAt)}</time>
      </p>
    </section>
  );
}

function StatusPill({ status }) {
  const key = statusKey(status);
  const label = String(status ?? "Pending")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const tones = {
    delivered: "bg-success/10 text-success ring-success/25 dark:text-fresh",
    ready: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    "on-the-way": "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    preparing: "bg-warning/15 text-amber-800 ring-warning/30 dark:text-gold",
    cancelled: "bg-destructive/10 text-destructive ring-destructive/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ring-1",
        tones[key] ?? "bg-muted text-muted-foreground ring-border",
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || "Pending"}
    </span>
  );
}

function StatusTracker({ status, compact = false, onTheWay = false }) {
  const key = statusKey(status);
  let currentIndex =
    key === "delivered"
      ? TRACKER_STEPS.length - 1
      : key === "on-the-way"
        ? 2
        : key === "ready"
          ? 1
          : 0;
  if (onTheWay && currentIndex === 1) currentIndex = 2;

  return (
    <ol
      aria-label="Order fulfillment steps"
      className={cn("flex w-full items-start", compact ? "gap-1" : "gap-2")}
    >
      {TRACKER_STEPS.map((step, index) => {
        const complete = key === "delivered" ? index <= currentIndex : index < currentIndex;
        const current = key !== "delivered" && index === currentIndex;
        const Icon = step.icon;
        return (
          <li
            key={step.key}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center"
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index > 0 && (complete || key === "delivered") ? "bg-fresh" : "bg-border",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                  compact ? "h-8 w-8" : "h-9 w-9",
                  complete
                    ? "bg-success text-success-foreground"
                    : current
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 flex-1 rounded-full",
                  complete && index < TRACKER_STEPS.length - 1 ? "bg-fresh" : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 text-center text-[10px] font-bold uppercase tracking-wide sm:text-xs",
                complete
                  ? "text-success dark:text-fresh"
                  : current
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order }) {
  const status = normalizeStatus(order);
  const key = statusKey(status);
  const deliveredAt = getDeliveredAt(order);
  const readyAt = getReadyAt(order);
  const etaMinutes = Number(order.etaMinutes) || DEFAULT_ETA_MINUTES;
  const paid = isPaid(order.paymentStatus);
  const placedAt = order.paidAt || order.createdAt;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <article className="rounded-[2rem] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ReceiptText aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">#{shortId(order)}</h2>
              <StatusPill status={status} />
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                  paid
                    ? "bg-success/10 text-success ring-success/25 dark:text-fresh"
                    : "bg-warning/15 text-amber-800 ring-warning/30 dark:text-gold",
                )}
              >
                {String(order.paymentStatus || "Unconfirmed")}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
              {order.hostel || "Hostel"} · Room {order.room || "—"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              Placed <time dateTime={dateTimeAttr(placedAt)}>{formatOrderDateTime(placedAt)}</time>
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-2xl font-black tracking-tight tabular-nums text-primary">
            {formatNGN(Number(order.total || 0))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {items.reduce((count, item) => count + Number(item.qty || 0), 0)} items
          </p>
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
        <StatusTracker status={status} compact />
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-5">
        {items.map((item, index) => (
          <div
            key={`${order._id ?? order.id}-item-${index}`}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Package aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">
                  {Number(item.qty || 1)}× {item.name || "Meal"}
                </span>
                {item.soupType ? <span> ({item.soupType})</span> : null}
              </span>
            </div>
            <span className="shrink-0 font-bold tabular-nums">
              {formatNGN(Number(item.price || 0) * Number(item.qty || 1))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {paid ? "Paid via" : "Payment method"}{" "}
          <span className="font-bold text-foreground">{order.paymentMethod || "—"}</span>
          {order.reference ? <span className="ml-2">· Ref {order.reference}</span> : null}
        </p>
        <Link
          to="/payments"
          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
        >
          Receipt
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {key === "delivered" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-bold text-success dark:text-fresh">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          <span>
            Delivered on{" "}
            <time dateTime={dateTimeAttr(deliveredAt)}>{formatOrderDateTime(deliveredAt)}</time>
          </span>
        </div>
      ) : key === "ready" || key === "on-the-way" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-800 dark:text-sky-300">
          <Bike aria-hidden="true" className="h-4 w-4" />
          <span>
            Ready at <time dateTime={dateTimeAttr(readyAt)}>{formatOrderDateTime(readyAt)}</time> ·
            arriving in ~{etaMinutes} min
          </span>
        </div>
      ) : null}
    </article>
  );
}
