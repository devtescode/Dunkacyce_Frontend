import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  PackageCheck,
  ReceiptText,
  Search,
  Truck,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  LoadingBlock,
  RefreshButton,
  StatusPill,
  toneClasses,
} from "@/components/admin";
import { DeliveryEvidenceBadge } from "@/components/admin/orders/DeliveryEvidenceBadge";
import { OrderStatsBar } from "@/components/admin/orders/OrderStatsBar";
import { OrderTable } from "@/components/admin/orders/OrderTable";
import { OrderToolbar } from "@/components/admin/orders/OrderToolbar";
import { StudentProfileCard } from "@/components/admin/orders/StudentProfileCard";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  queryKeys,
  useAdminOrdersQuery,
  useAdminUsersQuery,
  useUpdateOrderStatusMutation,
} from "@/lib/api";
import {
  formatOrderDateTime,
  getDeliveredAt,
  getDeliveryEvidence,
  getLateElapsedMs,
  getReadyAt,
  normalizeStatus,
} from "@/lib/orderTracking";
import { getAdminSocket, ORDER_STATUS_EVENTS } from "@/lib/socket";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management – Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

function isLateOrder(order, current) {
  try {
    return (
      getDeliveryEvidence(order, current)?.verdict === "late" ||
      Number(getLateElapsedMs(order, current)) > 0
    );
  } catch {
    return false;
  }
}

function getLateMagnitude(order, current) {
  try {
    const lateByMs = Number(getDeliveryEvidence(order, current)?.lateByMs) || 0;
    const elapsedMs = Number(getLateElapsedMs(order, current)) || 0;
    return Math.max(lateByMs, elapsedMs);
  } catch {
    return 0;
  }
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

function OrderDetailsSheet({ order, open, onOpenChange, profile, now }) {
  const items = getItems(order);
  const deliveredAt = getDeliveredAt(order);
  const readyAt = getReadyAt(order);
  const status = normalizeStatus(order);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
          <StudentProfileCard
            student={order.userId}
            profile={profile}
            hostel={order.hostel}
            room={order.room}
            variant="full"
          />

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
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Fulfillment timeline
            </p>
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
            <div className="mt-4">
              <DeliveryEvidenceBadge order={order} now={now} variant="full" />
            </div>
          </AdminPanel>
        </div>
      </SheetContent>
    </Sheet>
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
  const { data: adminUsers } = useAdminUsersQuery();
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatusMutation();
  const queryClient = useQueryClient();

  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [showPii, setShowPii] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) {
      setConnected(false);
      return undefined;
    }

    setConnected(Boolean(socket.connected));

    const invalidateOrders = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
    };
    const handleConnect = () => {
      setConnected(true);
      invalidateOrders();
    };
    const handleDisconnect = () => setConnected(false);

    ORDER_STATUS_EVENTS.forEach((event) => socket.on(event, invalidateOrders));
    // Socket.IO does not replay missed events; resync on every (re)connection.
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      ORDER_STATUS_EVENTS.forEach((event) => socket.off(event, invalidateOrders));
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [queryClient]);

  const profilesByStudentId = useMemo(() => {
    const users = Array.isArray(adminUsers)
      ? adminUsers
      : Array.isArray(adminUsers?.users)
        ? adminUsers.users
        : [];
    const map = new Map();
    users.forEach((user) => {
      const key = user?._id ?? user?.id ?? user?.email;
      if (key === undefined || key === null || key === "") return;
      map.set(String(key), user);
    });
    return map;
  }, [adminUsers]);

  const allOrders = Array.isArray(data) ? data : [];

  // ONLY PAID ORDERS
  const orders = allOrders.filter((o) => o?.paymentStatus === "Paid");

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0);
    const preparing = orders.filter((order) => normalizeStatus(order) === "Preparing").length;
    const ready = orders.filter((order) => normalizeStatus(order) === "Ready").length;
    const delivered = orders.filter((order) => normalizeStatus(order) === "Delivered").length;
    const late = orders.filter((order) => isLateOrder(order, now)).length;
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
      late,
    };
  }, [orders, now]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Delivered: 0,
    };
    orders.forEach((order) => {
      const status = normalizeStatus(order);
      if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
    });
    return counts;
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
        case "total-desc":
          return bTotal - aTotal;
        case "total-asc":
          return aTotal - bTotal;
        case "late-first": {
          const aLate = isLateOrder(a, now);
          const bLate = isLateOrder(b, now);
          if (aLate !== bLate) return aLate ? -1 : 1;
          if (aLate && bLate) {
            const magnitudeDiff = getLateMagnitude(b, now) - getLateMagnitude(a, now);
            if (magnitudeDiff !== 0) return magnitudeDiff;
          }
          return bTime - aTime;
        }
        case "newest":
        default:
          return bTime - aTime;
      }
    });

    return filtered;
  }, [orders, search, statusFilter, sortBy, now]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const notifyAlreadyDelivered = (order) => {
    toast.info("This order has already been delivered", {
      description: `Order ${getShortOrderId(order)} was handed off and its status is locked.`,
    });
    const id = getOrderId(order);
    if (!id) return;
    setUnlockedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleUnlock = (id) => {
    if (!id) return;
    const order = orders.find((candidate) => getOrderId(candidate) === id);
    if (normalizeStatus(order) === "Delivered") {
      notifyAlreadyDelivered(order);
      return;
    }
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
    if (currentStatus === "Delivered") {
      notifyAlreadyDelivered(order);
      return;
    }
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
        <OrderStatsBar stats={stats} isPending={isPending} />

        <OrderToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          statusCounts={statusCounts}
          total={orders.length}
          shown={filteredOrders.length}
          onClear={clearFilters}
          showPii={showPii}
          onTogglePii={setShowPii}
          connected={connected}
        />

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
          <OrderTable
            rows={filteredOrders}
            now={now}
            showPii={showPii}
            updatingIds={updatingIds}
            unlockedIds={unlockedIds}
            onToggleUnlock={toggleUnlock}
            onChangeStatus={(order, status) => requestStatusChange(order, status)}
            onDeliveredAttempt={notifyAlreadyDelivered}
            onOpenDetails={(order) => setSelectedOrder(order)}
          />
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

      {selectedOrder ? (
        <OrderDetailsSheet
          order={selectedOrder}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
          profile={profilesByStudentId.get(String(getStudentKey(selectedOrder) ?? ""))}
          now={now}
        />
      ) : null}
    </AdminShell>
  );
}
