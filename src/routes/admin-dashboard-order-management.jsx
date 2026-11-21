import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  LockOpen,
  MapPin,
  PackageCheck,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Truck,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingBlock,
  RefreshButton,
  SearchField,
  SectionHeading,
  StatCard,
  StatusPill,
  toneClasses,
} from "@/components/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  queryKeys,
  useAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} from "@/lib/api";
import {
  DEFAULT_ETA_MINUTES,
  formatOrderDateTime,
  getDeliveredAt,
  getEtaDeadline,
  getReadyAt,
  normalizeStatus,
} from "@/lib/orderTracking";
import { getAdminSocket } from "@/lib/socket";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management – Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const STATUS_OPTIONS = ["Pending", "Preparing", "Ready", "Delivered"];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUS_OPTIONS.map((option) => ({ value: option, label: option })),
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-high", label: "Total: high to low" },
  { value: "total-low", label: "Total: low to high" },
];

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
}

function toDateTimeAttr(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatMoney(value) {
  const amount = Number(value);
  return formatNGN(Number.isFinite(amount) ? amount : 0);
}

function getOrderId(order) {
  return String(order?._id ?? order?.id ?? "");
}

function getShortOrderId(order) {
  const id = getOrderId(order);
  return id ? `#${id.slice(-6).toUpperCase()}` : "#—";
}

function getCustomerName(order) {
  return order?.userId?.fullName || order?.user?.fullName || "Unknown User";
}

function getCustomerEmail(order) {
  return order?.userId?.email || order?.user?.email || "—";
}

function getCustomerPhone(order) {
  return order?.userId?.phone || order?.user?.phone || "—";
}

function getStudentKey(order) {
  const user = order?.userId ?? order?.user;
  const id = user?._id ?? user?.id ?? user?.email ?? user;
  if (id === undefined || id === null || id === "") return null;
  if (typeof id === "object") {
    const fallback = id?._id ?? id?.id ?? id?.email;
    return fallback === undefined || fallback === null || fallback === ""
      ? null
      : String(fallback);
  }
  return String(id);
}

function getItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function getStatusToneName(status) {
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

function getConfirmToneClass(status) {
  switch (status) {
    case "Delivered":
      return "bg-success text-success-foreground hover:bg-success/90";
    case "Ready":
      return "bg-blue-600 text-white hover:bg-blue-700";
    case "Preparing":
      return "bg-warning text-amber-950 hover:bg-warning/90";
    default:
      return "";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Delivered":
      return PackageCheck;
    case "Ready":
      return Truck;
    case "Preparing":
      return Clock3;
    default:
      return ReceiptText;
  }
}

function PaymentBadge({ order }) {
  const isPaid = order?.paymentStatus === "Paid";
  return (
    <StatusPill tone={isPaid ? "fresh" : "neutral"} dot={false}>
      {isPaid ? <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> : null}
      {isPaid ? "Paid" : order?.paymentStatus || "Unpaid"}
    </StatusPill>
  );
}

function StatusBadge({ status }) {
  const tone = getStatusToneName(status);
  const Icon = getStatusIcon(status);
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", toneClasses[tone].icon)}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      </span>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function OrderDetailsSheet({ order }) {
  const items = getItems(order);
  const deliveredAt = getDeliveredAt(order);
  const readyAt = getReadyAt(order);
  const etaDeadline = getEtaDeadline(order);
  const status = normalizeStatus(order);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-border/70 bg-background/80"
        >
          View details
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-5 sm:max-w-xl sm:p-6">
        <SheetHeader className="space-y-3 pr-8 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentBadge order={order} />
            <StatusBadge status={status} />
          </div>
          <SheetTitle className="font-display text-2xl tracking-tight">
            Order {getShortOrderId(order)}
          </SheetTitle>
          <SheetDescription>
            Placed {formatDateTime(order?.createdAt)}. Full order and customer details are shown below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <AdminPanel className="p-4">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Order summary
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Order ID" value={getOrderId(order) || "—"} />
              <DetailField label="Created" value={formatDateTime(order?.createdAt)} />
              <DetailField label="Customer" value={getCustomerName(order)} />
              <DetailField label="Email" value={getCustomerEmail(order)} />
              <DetailField label="Phone" value={getCustomerPhone(order)} />
              <DetailField
                label="Location"
                value={`${order?.hostel || "—"} · Room ${order?.room || "—"}`}
              />
              <DetailField label="Payment method" value={order?.paymentMethod || "—"} />
              <DetailField label="Total paid" value={formatMoney(order?.total)} />
            </div>
          </AdminPanel>

          <AdminPanel className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Items
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>
            {items.length > 0 ? (
              <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
                {items.map((item, index) => {
                  const qty = Number(item?.qty) || 0;
                  const price = Number(item?.price) || 0;
                  return (
                    <div
                      key={`${item?.name || "item"}-${index}`}
                      className="flex items-start justify-between gap-4 p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {item?.name || "Unnamed item"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {qty} × {formatMoney(price)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-foreground">
                        {formatMoney(qty * price)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No items available.
              </p>
            )}
          </AdminPanel>

          <AdminPanel className="p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Fulfillment timeline
              </p>
              {deliveredAt ? (
                <StatusPill tone="fresh" dot={false}>
                  <CalendarCheck2 aria-hidden="true" className="h-3 w-3" />
                  Delivery recorded
                </StatusPill>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <DetailField label="Placed" value={formatDateTime(order?.createdAt)} />
              <DetailField
                label="Ready"
                value={readyAt ? formatOrderDateTime(readyAt) : "—"}
              />
              <DetailField
                label="Delivered"
                value={
                  deliveredAt ? (
                    <time dateTime={toDateTimeAttr(deliveredAt)}>
                      {formatOrderDateTime(deliveredAt)}
                    </time>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
            {deliveredAt ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-xs leading-5 text-success">
                <CalendarCheck2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Delivered <time dateTime={toDateTimeAttr(deliveredAt)}>{formatOrderDateTime(deliveredAt)}</time>
                  . This is the recorded handoff date and time.
                </span>
              </div>
            ) : status === "Ready" && etaDeadline ? (
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Truck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Estimated arrival by {formatOrderDateTime(etaDeadline)} · ~
                {order?.etaMinutes || DEFAULT_ETA_MINUTES} min to arrival
              </p>
            ) : null}
          </AdminPanel>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FulfillmentControl({
  order,
  onRequestStatusChange,
  isUpdating,
  isUnlocked,
  onToggleUnlock,
}) {
  const currentStatus = normalizeStatus(order);
  // Radix skips onValueChange when the chosen value equals the controlled `value`.
  // A canonical status that is not a Select option must map to the empty-string
  // placeholder, never to a lookalike option (e.g. "Preparing"), otherwise the
  // change is silently swallowed.
  const selectValue = STATUS_OPTIONS.includes(currentStatus) ? currentStatus : "";
  const shortId = getShortOrderId(order);
  const orderId = getOrderId(order);
  const UnlockIcon = isUnlocked ? LockOpen : Lock;
  const lockButtonRef = useRef(null);
  const wasUnlocked = useRef(isUnlocked);

  // Re-lock after a confirmed change removes the Select; restore focus to the lock button.
  useEffect(() => {
    if (wasUnlocked.current && !isUnlocked) lockButtonRef.current?.focus();
    wasUnlocked.current = isUnlocked;
  }, [isUnlocked]);

  return (
    <div className="w-full space-y-2 sm:max-w-[280px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Fulfillment status
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
        <StatusPill tone={getStatusToneName(currentStatus)}>{currentStatus}</StatusPill>
        <button
          ref={lockButtonRef}
          type="button"
          onClick={onToggleUnlock}
          disabled={isUpdating || !orderId}
          aria-label={`Change fulfillment status for order ${shortId}`}
          title={isUnlocked ? "Lock status control" : "Unlock status control"}
          className={cn(
            "ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
            isUnlocked && "border-primary/25 bg-primary/10 text-primary",
          )}
        >
          <UnlockIcon aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      {isUnlocked ? (
        <Select
          value={selectValue}
          onValueChange={(value) => onRequestStatusChange(order, value)}
          disabled={isUpdating || !orderId}
        >
          <SelectTrigger
            className="h-9 rounded-xl bg-background focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label={`Update status for order ${shortId}`}
            aria-busy={isUpdating}
          >
            <span className="flex items-center gap-2">
              {isUpdating ? (
                <>
                  <Loader2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                  <span className="sr-only">Updating status…</span>
                </>
              ) : null}
              <SelectValue placeholder="Select status" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Use the lock button (Enter or Space) to change the fulfillment status.
        </p>
      )}

      <p className="text-xs text-muted-foreground">Placed {formatDate(order?.createdAt)}</p>
    </div>
  );
}

function OrderCard({
  order,
  onRequestStatusChange,
  isUpdating,
  isUnlocked,
  onToggleUnlock,
}) {
  const items = getItems(order);
  const visibleItems = items.slice(0, 3);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);
  const status = normalizeStatus(order);
  const deliveredAt = getDeliveredAt(order);
  const readyAt = getReadyAt(order);

  return (
    <AdminPanel
      as="article"
      className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="space-y-3 border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl tracking-tight text-foreground">
                {getShortOrderId(order)}
              </p>
              <PaymentBadge order={order} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{formatDateTime(order?.createdAt)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Total paid
            </p>
            <p className="mt-1 font-display text-2xl leading-none tabular-nums text-foreground">
              {formatMoney(order?.total)}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
        {deliveredAt ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-success">
            <CalendarCheck2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <time dateTime={toDateTimeAttr(deliveredAt)}>
              Delivered {formatOrderDateTime(deliveredAt)}
            </time>
          </p>
        ) : status === "Ready" ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Truck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>
              Ready {formatOrderDateTime(readyAt)} · ~
              {order?.etaMinutes || DEFAULT_ETA_MINUTES} min to arrival
            </span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Customer
            </p>
            <p className="font-medium text-foreground">{getCustomerName(order)}</p>
            <p className="break-all text-sm text-muted-foreground">{getCustomerEmail(order)}</p>
            <p className="text-sm text-muted-foreground">{getCustomerPhone(order)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Delivery
            </p>
            <p className="flex items-start gap-1.5 font-medium text-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{order?.hostel || "—"}</span>
            </p>
            <p className="text-sm text-muted-foreground">Room {order?.room || "—"}</p>
            <p className="text-sm text-muted-foreground">
              Paid via <span className="font-medium text-foreground">{order?.paymentMethod || "—"}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Order items
            </p>
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-2">
            {visibleItems.length > 0 ? (
              visibleItems.map((item, index) => {
                const qty = Number(item?.qty) || 0;
                const price = Number(item?.price) || 0;
                return (
                  <div
                    key={`${item?.name || "item"}-${index}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 text-muted-foreground">
                      <span className="font-medium text-foreground">{qty}×</span>{" "}
                      {item?.name || "Unnamed item"}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">
                      {formatMoney(qty * price)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No items available.</p>
            )}
          </div>
          {remainingCount > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              +{remainingCount} more item{remainingCount === 1 ? "" : "s"} in details
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <FulfillmentControl
            order={order}
            onRequestStatusChange={onRequestStatusChange}
            isUpdating={isUpdating}
            isUnlocked={isUnlocked}
            onToggleUnlock={onToggleUnlock}
          />
          <OrderDetailsSheet order={order} />
        </div>
      </div>
    </AdminPanel>
  );
}

function LoadingState() {
  return (
    <LoadingBlock
      variant="rows"
      rows={6}
      label="Loading paid orders"
      caption="Fetching the latest successful payments…"
    />
  );
}

function OrderManagementPage() {
  const { data, error, isPending, isFetching, refetch } = useAdminOrdersQuery();
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatusMutation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return undefined;

    const invalidateOrders = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
    };
    const events = ["order_status_updated", "order_ready", "order_delivered"];

    events.forEach((event) => socket.on(event, invalidateOrders));
    // Socket.IO does not replay missed events; resync on every (re)connection.
    socket.on("connect", invalidateOrders);
    return () => {
      events.forEach((event) => socket.off(event, invalidateOrders));
      socket.off("connect", invalidateOrders);
    };
  }, [queryClient]);

  const allOrders = Array.isArray(data) ? data : [];

  // ONLY PAID ORDERS
  const orders = allOrders.filter((o) => o?.paymentStatus === "Paid");

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0);
    const preparing = orders.filter((order) => normalizeStatus(order) === "Preparing").length;
    const ready = orders.filter((order) => normalizeStatus(order) === "Ready").length;
    const delivered = orders.filter((order) => normalizeStatus(order) === "Delivered").length;
    const paidStudentIds = new Set();
    const studentsToDeliverIds = new Set();
    orders.forEach((order) => {
      const studentKey = getStudentKey(order);
      if (!studentKey) return;
      paidStudentIds.add(studentKey);
      if (normalizeStatus(order) !== "Delivered") {
        studentsToDeliverIds.add(studentKey);
      }
    });
    return {
      paidCount: orders.length,
      paidStudents: paidStudentIds.size,
      studentsToDeliver: studentsToDeliverIds.size,
      revenue,
      preparing,
      ready,
      delivered,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const status = normalizeStatus(order);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!query) return true;
      const haystack = [
        getOrderId(order),
        getShortOrderId(order),
        getCustomerName(order),
        getCustomerEmail(order),
        getCustomerPhone(order),
        order?.hostel,
        order?.room,
        order?.paymentMethod,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    filtered.sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      const aTotal = Number(a?.total) || 0;
      const bTotal = Number(b?.total) || 0;

      switch (sortBy) {
        case "oldest":
          return aTime - bTime;
        case "total-high":
          return bTotal - aTotal;
        case "total-low":
          return aTotal - bTotal;
        case "newest":
        default:
          return bTime - aTime;
      }
    });

    return filtered;
  }, [orders, search, statusFilter, sortBy]);

  const hasActiveFilters = search.trim() || statusFilter !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const toggleUnlock = (id) => {
    if (!id) return;
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const requestStatusChange = (order, nextStatus) => {
    const orderId = getOrderId(order);
    if (!orderId || !nextStatus) return;

    const currentStatus = normalizeStatus(order);
    const canonicalNextStatus = normalizeStatus({ status: nextStatus });
    // Only skip a true no-op. Every other transition is allowed.
    if (canonicalNextStatus === currentStatus) return;

    setPendingStatusChange({
      orderId,
      nextStatus: canonicalNextStatus,
      currentStatus,
      customerName: getCustomerName(order),
      shortId: getShortOrderId(order),
    });
  };

  const updateStatus = async (id, status) => {
    if (!id) return false;
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      const response = await updateOrderStatus({ id, status });
      // Some API responses resolve with success:false instead of throwing.
      if (response?.success === false) {
        const reason =
          (typeof response.message === "string" && response.message.trim()) ||
          (typeof response.error === "string" && response.error.trim()) ||
          "The orders service rejected this status change.";
        throw new Error(reason);
      }
      toast.success("Fulfillment status updated", { description: `Now ${status}.` });
      return true;
    } catch (updateError) {
      toast.error("Couldn’t update fulfillment status", {
        description:
          updateError?.message ||
          "The orders service didn’t confirm the change. Check your connection and try again.",
      });
      return false;
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { orderId, nextStatus } = pendingStatusChange;
    const didUpdate = await updateStatus(orderId, nextStatus);
    if (!didUpdate) return;

    setPendingStatusChange(null);
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const isConfirming = Boolean(
    pendingStatusChange && updatingIds.has(pendingStatusChange.orderId),
  );

  return (
    <AdminShell
      eyebrow="Operations"
      title="Paid Orders"
      description="Review successful payments, update fulfillment status, and see exactly when each order was delivered."
      actions={
        <RefreshButton
          onClick={() => refetch()}
          isFetching={isFetching}
          label={isFetching ? "Refreshing" : "Refresh"}
        />
      }
    >
      <div className="space-y-6">
        <section
          aria-label="Paid order statistics"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
        >
          <StatCard
            icon={Wallet}
            label="Paid Orders"
            value={stats.paidCount}
            hint="Successful payments only"
            tone="forest"
            isLoading={isPending}
          />
          <StatCard
            icon={Users}
            label="Paid Students"
            value={stats.paidStudents}
            hint="Distinct students with paid orders"
            tone="violet"
            isLoading={isPending}
          />
          <StatCard
            icon={UserCheck}
            label="Students To Deliver"
            value={stats.studentsToDeliver}
            hint="Paid students awaiting delivery"
            tone="gold"
            isLoading={isPending}
          />
          <StatCard
            icon={ReceiptText}
            label="Revenue"
            value={formatMoney(stats.revenue)}
            hint="Total from paid orders"
            tone="fresh"
            isLoading={isPending}
          />
          <StatCard
            icon={Clock3}
            label="Preparing"
            value={stats.preparing}
            hint={`${stats.ready} ready for handoff`}
            tone="gold"
            isLoading={isPending}
          />
          <StatCard
            icon={PackageCheck}
            label="Delivered"
            value={stats.delivered}
            hint={`${stats.paidCount - stats.delivered} still in progress`}
            tone="fresh"
            isLoading={isPending}
          />
        </section>

        <AdminPanel as="section" aria-label="Paid order tools" className="p-4 sm:p-5">
          <SectionHeading
            eyebrow="Operations board"
            title="Order directory"
            description="Search, filter, and sort successful payments."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <SlidersHorizontal aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {isPending ? (
                    <span>Loading paid orders…</span>
                  ) : (
                    <span>
                      Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span>{" "}
                      of <span className="font-semibold text-foreground">{orders.length}</span> paid orders
                    </span>
                  )}
                </span>
                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-full"
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            }
          />

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px]">
            <div className="space-y-1.5">
              <label
                htmlFor="order-search"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Search orders
              </label>
              <div className="relative">
                <SearchField
                  id="order-search"
                  label="Search orders"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order, customer, hostel, or room"
                  className="pr-10"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    aria-label="Clear search"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="status-filter"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Status
              </label>
              <FilterSelect
                id="status-filter"
                label="Filter paid orders by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_FILTER_OPTIONS}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sort-orders"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Sort by
              </label>
              <FilterSelect
                id="sort-orders"
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        </AdminPanel>

        {error ? (
          <ErrorState
            title="Couldn’t load paid orders"
            description="We couldn’t reach the orders service. Check your connection and try again."
            onRetry={() => refetch()}
            retryLabel="Retry"
          />
        ) : isPending ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No paid orders yet"
            description="Successful Paystack payments will appear here as soon as customers complete checkout."
            action={<RefreshButton onClick={() => refetch()} isFetching={isFetching} label="Check again" />}
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching orders"
            description="Try adjusting your search, status filter, or sort to find the paid order you’re looking for."
            action={
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                Clear filters
              </Button>
            }
          />
        ) : (
          <section aria-label="Paid orders" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredOrders.map((order, index) => {
              const id = getOrderId(order);
              return (
                <OrderCard
                  key={id || `order-${index}`}
                  order={order}
                  onRequestStatusChange={requestStatusChange}
                  isUpdating={id ? updatingIds.has(id) : false}
                  isUnlocked={id ? unlockedIds.has(id) : false}
                  onToggleUnlock={() => toggleUnlock(id)}
                />
              );
            })}
          </section>
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setPendingStatusChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change status to {pendingStatusChange?.nextStatus || "…"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange ? (
                <>
                  Order{" "}
                  <span className="font-medium text-foreground">
                    {pendingStatusChange.shortId}
                  </span>{" "}
                  for{" "}
                  <span className="font-medium text-foreground">
                    {pendingStatusChange.customerName}
                  </span>{" "}
                  will move from{" "}
                  <span className="font-medium text-foreground">
                    {pendingStatusChange.currentStatus}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {pendingStatusChange.nextStatus}
                  </span>
                  .
                  {pendingStatusChange.nextStatus === "Ready"
                    ? " Ready starts the student’s arrival countdown."
                    : null}
                  {pendingStatusChange.nextStatus === "Delivered"
                    ? " Delivered records the exact time and date of handoff."
                    : null}{" "}
                  The student sees the update immediately.
                </>
              ) : (
                "Confirm the fulfillment status update for this order."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isConfirming}
              onClick={(event) => {
                event.preventDefault();
                void confirmStatusChange();
              }}
              className={cn(
                "rounded-xl",
                getConfirmToneClass(pendingStatusChange?.nextStatus),
              )}
            >
              {isConfirming ? (
                <>
                  <Loader2 aria-hidden="true" className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                "Confirm change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
