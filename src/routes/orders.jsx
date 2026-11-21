import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock3,
  MapPin,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
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

/** Shared screen-reader sentence for live ETA updates, including the final minute. */
function etaRemainingSentence(countdown) {
  if (countdown.isExpired) return "Arrival estimate elapsed. We are checking with the kitchen.";
  if (countdown.minutes < 1) return "Under a minute remaining.";
  return `About ${countdown.minutes} ${countdown.minutes === 1 ? "minute" : "minutes"} remaining.`;
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
    const handleStatusEvent = (payload = {}, eventName = "order_status_updated") => {
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
      // Fail closed: only act on events that explicitly belong to this student.
      if (eventUserIds.length === 0 || !eventUserIds.some((id) => id === String(user.id))) {
        return;
      }

      // Alias events can omit `status`; the event name itself is authoritative.
      const status =
        payload?.status ??
        payload?.order?.status ??
        (eventName === "order_ready"
          ? "Ready"
          : eventName === "order_delivered"
            ? "Delivered"
            : "Preparing");
      const orderId =
        payload?.orderId ??
        payload?.order?._id ??
        payload?.order?.id ??
        payload?.reference ??
        payload?.order?.reference;
      if (orderId == null) return;

      const dedupeKey = `${String(orderId)}:${statusKey(status)}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.user(user.id),
      });

      const etaMinutes = Number(payload?.etaMinutes) || DEFAULT_ETA_MINUTES;
      const key = statusKey(status);
      if (key === "ready") {
        toast.success(`Your order is ready! Estimated arrival in about ${etaMinutes} minutes.`);
      } else if (key === "delivered") {
        toast.success("Your order has been delivered. Enjoy!");
      } else if (key === "preparing") {
        toast("Your order is being prepared.");
      } else {
        toast("Your order was updated.");
      }
    };

    const resync = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.user(user.id) });
    };
    const handlers = new Map();
    for (const event of ORDER_STATUS_EVENTS) {
      const handler = (payload) => handleStatusEvent(payload, event);
      handlers.set(event, handler);
      socket.on(event, handler);
    }
    // Socket.IO does not replay missed events; resync whenever the link returns.
    socket.on("connect", resync);

    return () => {
      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
      socket.off("connect", resync);
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
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow every step from the kitchen to your hostel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => ordersQuery.refetch()}
          disabled={ordersQuery.isFetching}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60 motion-reduce:transition-none"
        >
          <RotateCcw
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5",
              ordersQuery.isFetching &&
                "animate-[dk-spin_1s_linear_infinite] motion-reduce:animate-none",
            )}
          />
          {ordersQuery.isFetching ? "Refreshing" : "Refresh"}
        </button>
      </header>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <p>
          Active orders{" "}
          <span className="ml-1 text-lg font-semibold tabular-nums text-foreground">
            {stats.active}
          </span>
        </p>
        <p>
          Delivered{" "}
          <span className="ml-1 text-lg font-semibold tabular-nums text-foreground">
            {stats.delivered}
          </span>
        </p>
        <p>
          Total spent{" "}
          <span className="ml-1 text-lg font-semibold tabular-nums text-foreground">
            {formatNGN(stats.spent)}
          </span>
        </p>
      </div>

      {ordersQuery.isPending ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <DunnkayceLoader
            variant="compact"
            label="Loading your orders"
            caption="Fetching your live order history."
          />
        </div>
      ) : ordersQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Could not load orders</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t reach the kitchen just now. Please try again.
          </p>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 motion-reduce:transition-none"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <UtensilsCrossed aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">No orders yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once you place an order, you can follow it right here.
          </p>
          <Link
            to="/user-dashboard"
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 motion-reduce:transition-none"
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
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <Search aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">No matching orders</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different search or clear the status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary motion-reduce:transition-none"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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

function Toolbar({ search, onSearchChange, filter, onFilterChange, shown, total }) {
  return (
    <section
      aria-label="Order search and filters"
      className="flex flex-wrap items-center gap-3"
    >
      <div className="relative w-full sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
          className="min-h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
              "inline-flex min-h-11 items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition motion-reduce:transition-none",
              filter === option.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
        Showing <span className="font-semibold tabular-nums text-foreground">{shown}</span> of{" "}
        <span className="font-semibold tabular-nums text-foreground">{total}</span> orders
      </p>
    </section>
  );
}

function Spotlight({ order, status, countdown, etaMinutes }) {
  const key = statusKey(status);
  const isReady = key === "ready" || key === "on-the-way";
  // Only a real backend dispatch status advances the tracker; an elapsed ETA is not dispatch.
  const isOnTheWay = key === "on-the-way";
  const hasDeadline = getEtaDeadline(order) != null;
  const progress = hasDeadline
    ? Math.min(
        100,
        Math.max(0, 100 - (Number(countdown.totalMs ?? 0) / (etaMinutes * 60000)) * 100),
      )
    : 0;
  const hostel = order.hostel || "your hostel";
  const room = order.room || "—";
  const statusText = isReady
    ? isOnTheWay
      ? "On the way to you"
      : key === "ready" && countdown.isExpired
        ? "Ready — arrival estimate elapsed"
        : "Ready for handoff"
    : "Preparing";

  return (
    <section aria-label="Live order status" className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-sm font-semibold text-foreground">
              {statusText}
            </h2>
            <span className="text-[11px] text-muted-foreground">#{shortId(order)}</span>
          </div>
          <p className="mt-0.5 min-w-0 break-words text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            {hostel} · Room {room}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {isReady ? "Arrival countdown" : "Estimated arrival"}
          </p>
          <p
            aria-hidden="true"
            className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl"
          >
            {!isReady
              ? "Preparing"
              : !hasDeadline
                ? "Estimating"
                : countdown.isExpired
                  ? "ETA elapsed"
                  : countdown.label}
          </p>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {!isReady
          ? "Your order is being prepared."
          : !hasDeadline
            ? "Your order is ready. Arrival time is being confirmed."
            : `Your order is ready. ${etaRemainingSentence(countdown)}`}
      </p>

      <div
        role="progressbar"
        aria-label="Delivery progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={
          !isReady
            ? "Preparing. Estimated arrival countdown starts when the order is marked ready."
            : !hasDeadline
              ? "Ready. Arrival time is being confirmed."
              : etaRemainingSentence(countdown)
        }
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {!isReady
          ? `Your ${DEFAULT_ETA_MINUTES}-minute countdown starts when it’s marked ready.`
          : !hasDeadline
            ? "Arrival time is being confirmed — stay close."
            : countdown.isExpired
              ? "We’re checking with the kitchen and will update you shortly."
              : `About ${etaMinutes} minutes from when your order was marked ready.`}
      </p>

      <div className="mt-3">
        <StatusTracker status={status} onTheWay={isOnTheWay} compact />
      </div>
    </section>
  );
}

function DeliveredBanner({ order }) {
  const deliveredAt = getDeliveredAt(order);
  return (
    <section
      aria-label="Delivery confirmation"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-3"
    >
      <div className="min-w-0 text-sm">
        <h2 className="break-words font-semibold text-foreground">
          Last order delivered <span className="text-muted-foreground">#{shortId(order)}</span>
        </h2>
        <p className="mt-0.5 min-w-0 break-words text-xs text-muted-foreground">
          {order.hostel || "Hostel"} · Room {order.room || "—"}
        </p>
      </div>
      <p className="min-w-0 break-words text-xs text-muted-foreground">
        {deliveredAt == null ? (
          "Delivery time not recorded"
        ) : (
          <>
            Delivered on{" "}
            <time dateTime={dateTimeAttr(deliveredAt)}>{formatOrderDateTime(deliveredAt)}</time>
          </>
        )}
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
    delivered: "bg-success/10 text-emerald-800 ring-success/25 dark:text-fresh",
    ready: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    "on-the-way": "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    preparing: "bg-warning/15 text-amber-800 ring-warning/30 dark:text-gold",
    cancelled: "bg-destructive/10 text-destructive ring-destructive/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
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
                  "h-0.5 flex-1 rounded-full",
                  index > 0 && (complete || key === "delivered") ? "bg-fresh" : "bg-border",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full",
                  compact ? "h-6 w-6" : "h-8 w-8",
                  complete
                    ? "bg-success text-success-foreground"
                    : current
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  complete && index < TRACKER_STEPS.length - 1 ? "bg-fresh" : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1.5 break-words text-center text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-xs",
                complete
                  ? "text-emerald-800 dark:text-fresh"
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
    <article className="rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">#{shortId(order)}</h2>
            <StatusPill status={status} />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                paid
                  ? "bg-success/10 text-emerald-800 ring-success/25 dark:text-fresh"
                  : "bg-warning/15 text-amber-800 ring-warning/30 dark:text-gold",
              )}
            >
              {String(order.paymentStatus || "Unconfirmed")}
            </span>
          </div>
          <p className="mt-1.5 min-w-0 break-words text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            {order.hostel || "Hostel"} · Room {order.room || "—"}
          </p>
          <p className="mt-1 min-w-0 break-words text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            Placed <time dateTime={dateTimeAttr(placedAt)}>{formatOrderDateTime(placedAt)}</time>
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-lg font-semibold tabular-nums text-primary">
            {formatNGN(Number(order.total || 0))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {items.reduce((count, item) => count + Number(item.qty || 0), 0)} items
          </p>
        </div>
      </header>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {items.map((item, index) => (
            <li key={`${order._id ?? order.id}-item-${index}`} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {Number(item.qty || 1)}× {item.name || "Meal"}
                </span>
                {item.soupType ? <span> ({item.soupType})</span> : null}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {formatNGN(Number(item.price || 0) * Number(item.qty || 1))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <p className="min-w-0 break-words">
          {paid ? "Paid via" : "Payment method"}{" "}
          <span className="font-semibold text-foreground">{order.paymentMethod || "—"}</span>
          {order.reference ? (
            <span className="ml-2 break-all">· Ref {order.reference}</span>
          ) : null}
        </p>
        <Link
          to="/payments"
          aria-label={`Receipt for order #${shortId(order)}`}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline"
        >
          Receipt
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </footer>

      {key === "delivered" ? (
        <p className="mt-2 flex min-w-0 items-center gap-1.5 break-words text-xs font-medium text-success dark:text-fresh">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {deliveredAt == null ? (
            <span>Delivery time not recorded</span>
          ) : (
            <span className="min-w-0 break-words">
              Delivered on{" "}
              <time dateTime={dateTimeAttr(deliveredAt)}>{formatOrderDateTime(deliveredAt)}</time>
            </span>
          )}
        </p>
      ) : key === "ready" || key === "on-the-way" ? (
        <ReadyEta order={order} etaMinutes={etaMinutes} readyAt={readyAt} />
      ) : null}
    </article>
  );
}

/** Per-order live ETA so every ready order can be monitored, not just the spotlight. */
function ReadyEta({ order, etaMinutes, readyAt }) {
  const deadline = getEtaDeadline(order);
  const countdown = useCountdown(deadline);

  return (
    <p className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs text-muted-foreground">
      <Bike aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="min-w-0 break-words">
        Ready at <time dateTime={dateTimeAttr(readyAt)}>{formatOrderDateTime(readyAt)}</time>
      </span>
      <span aria-hidden="true" className="break-words tabular-nums">
        {deadline == null
          ? `· arriving in ~${etaMinutes} min`
          : countdown.isExpired
            ? "· arrival estimate elapsed — we’re checking"
            : `· arriving in ${countdown.label}`}
      </span>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {`Order #${shortId(order)} is ready. ${
          deadline == null ? "Arrival time is being confirmed." : etaRemainingSentence(countdown)
        }`}
      </span>
    </p>
  );
}
