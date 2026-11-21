import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrdersQuery, useUpdateOrderStatusMutation } from "@/lib/api";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management – Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const STATUS_OPTIONS = ["Preparing", "Ready", "Delivered"];

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

function getItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function getStatusTone(status) {
  switch (status) {
    case "Delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Ready":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Preparing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
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

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
              tone
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailsSheet({ order }) {
  const items = getItems(order);
  const StatusIcon = getStatusIcon(order?.status);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          View details
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-3 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Paid
            </Badge>
            <Badge variant="outline" className={cn("rounded-full", getStatusTone(order?.status))}>
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {order?.status || "Unknown"}
            </Badge>
          </div>
          <SheetTitle className="font-display text-2xl tracking-tight">
            Order {getShortOrderId(order)}
          </SheetTitle>
          <SheetDescription>
            Placed {formatDateTime(order?.createdAt)}. Full order and customer details are shown below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Items
              </h3>
              <span className="text-sm text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              {items.length > 0 ? (
                <div className="divide-y divide-border/70">
                  {items.map((item, index) => {
                    const qty = Number(item?.qty) || 0;
                    const price = Number(item?.price) || 0;
                    return (
                      <div
                        key={`${item?.name || "item"}-${index}`}
                        className="flex items-start justify-between gap-4 p-4"
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
                <p className="p-4 text-sm text-muted-foreground">No items available.</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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

function OrderCard({ order, onRequestStatusChange, isUpdating }) {
  const items = getItems(order);
  const visibleItems = items.slice(0, 3);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);
  const status = order?.status || "Preparing";
  const StatusIcon = getStatusIcon(status);
  const orderId = getOrderId(order);

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-4 border-b border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl tracking-tight text-foreground">
                {getShortOrderId(order)}
              </p>
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Paid
              </Badge>
              <Badge variant="outline" className={cn("rounded-full", getStatusTone(status))}>
                <StatusIcon className="mr-1 h-3.5 w-3.5" />
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(order?.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Total paid
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {formatMoney(order?.total)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
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
            <p className="font-medium text-foreground">{order?.hostel || "—"}</p>
            <p className="text-sm text-muted-foreground">Room {order?.room || "—"}</p>
            <p className="text-sm text-muted-foreground">
              Paid via <span className="font-medium text-foreground">{order?.paymentMethod || "—"}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4">
          <div className="flex items-center justify-between gap-3">
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
            <p className="text-xs text-muted-foreground">
              +{remainingCount} more item{remainingCount === 1 ? "" : "s"} in details
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full space-y-2 sm:max-w-[220px]">
            <label
              htmlFor={`status-${orderId}`}
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Fulfillment status
            </label>
            <Select
              value={STATUS_OPTIONS.includes(status) ? status : undefined}
              onValueChange={(value) => onRequestStatusChange(order, value)}
              disabled={isUpdating || !orderId}
            >
              <SelectTrigger
                id={`status-${orderId}`}
                className="h-10 rounded-xl bg-background"
                aria-label={`Update status for order ${getShortOrderId(order)}`}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="min-h-5 text-xs text-muted-foreground">
              {isUpdating ? "Updating status..." : `Placed ${formatDate(order?.createdAt)}`}
            </p>
          </div>

          <OrderDetailsSheet order={order} />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/70">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/70">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border/70">
            <CardHeader className="space-y-3 p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrderManagementPage() {
  const { data, error, isPending, isFetching, refetch } = useAdminOrdersQuery();
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatusMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  const allOrders = Array.isArray(data) ? data : [];

  // ONLY PAID ORDERS
  const orders = allOrders.filter((o) => o?.paymentStatus === "Paid");
  const loading = isPending;

  useEffect(() => {
    if (error) toast.error("Failed to load orders");
  }, [error]);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0);
    const preparing = orders.filter((order) => order?.status === "Preparing").length;
    const ready = orders.filter((order) => order?.status === "Ready").length;
    const delivered = orders.filter((order) => order?.status === "Delivered").length;
    return {
      paidCount: orders.length,
      revenue,
      preparing,
      ready,
      delivered,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const status = String(order?.status || "");
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

  const requestStatusChange = (order, nextStatus) => {
    const orderId = getOrderId(order);
    const currentStatus = order?.status || "Preparing";
    if (!orderId || !nextStatus || nextStatus === currentStatus) return;
    setPendingStatusChange({
      orderId,
      nextStatus,
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
      await updateOrderStatus({ id, status });
      toast.success("Status updated");
      return true;
    } catch {
      toast.error("Failed to update status");
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
    const ok = await updateStatus(orderId, nextStatus);
    if (ok) setPendingStatusChange(null);
  };

  const hasActiveFilters = search.trim() || statusFilter !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  return (
    <AdminShell
      eyebrow="Operations"
      title="Paid Orders"
      description="Track successful payments, monitor fulfillment, and update order progress from one premium operations view."
      actions={
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-full border-border/70 bg-background/80"
        >
          <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          {isFetching ? "Refreshing" : "Refresh"}
        </Button>
      }
    >
      <div className="space-y-6">
        <section aria-label="Paid order statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Paid Orders"
            value={stats.paidCount}
            hint="Successful payments only"
            tone="border-primary/20 bg-primary/10 text-primary"
          />
          <StatCard
            icon={ReceiptText}
            label="Revenue"
            value={formatMoney(stats.revenue)}
            hint="Total from paid orders"
            tone="border-emerald-200 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            icon={Clock3}
            label="Preparing"
            value={stats.preparing}
            hint={`${stats.ready} ready for handoff`}
            tone="border-amber-200 bg-amber-50 text-amber-700"
          />
          <StatCard
            icon={PackageCheck}
            label="Delivered"
            value={stats.delivered}
            hint={`${stats.paidCount - stats.delivered} still in progress`}
            tone="border-sky-200 bg-sky-50 text-sky-700"
          />
        </section>

        <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px]">
                <div className="space-y-2">
                  <label
                    htmlFor="order-search"
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Search orders
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="order-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by order, customer, hostel, or room"
                      className="h-10 rounded-xl pl-9 pr-9"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="status-filter"
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="h-10 rounded-xl bg-background">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="sort-orders"
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Sort by
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sort-orders" className="h-10 rounded-xl bg-background">
                      <SelectValue placeholder="Sort orders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="total-high">Total: high to low</SelectItem>
                      <SelectItem value="total-low">Total: low to high</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>
                    Showing <span className="font-medium text-foreground">{filteredOrders.length}</span> of{" "}
                    <span className="font-medium text-foreground">{orders.length}</span> paid orders
                  </span>
                </div>
                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full">
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-card/60 shadow-none">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl tracking-tight text-foreground">
                No paid orders yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Successful Paystack payments will appear here as soon as customers complete checkout.
              </p>
              <Button variant="outline" onClick={() => refetch()} className="mt-6 rounded-full">
                <RefreshCcw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
                Check again
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-card/60 shadow-none">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-muted-foreground">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl tracking-tight text-foreground">
                No matching orders
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try adjusting your search, status filter, or sort to find the paid order you’re looking for.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-6 rounded-full">
                Clear filters
              </Button>
            </CardContent>
          </Card>
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
                />
              );
            })}
          </section>
        )}

        <AlertDialog
          open={!!pendingStatusChange}
          onOpenChange={(open) => {
            if (!open && !(pendingStatusChange && updatingIds.has(pendingStatusChange.orderId))) {
              setPendingStatusChange(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm status change</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingStatusChange ? (
                  <>
                    Change order{" "}
                    <span className="font-medium text-foreground">{pendingStatusChange.shortId}</span>
                    {pendingStatusChange.customerName ? (
                      <>
                        {" "}
                        for{" "}
                        <span className="font-medium text-foreground">
                          {pendingStatusChange.customerName}
                        </span>
                      </>
                    ) : null}{" "}
                    from{" "}
                    <span className="font-medium text-foreground">{pendingStatusChange.currentStatus}</span>{" "}
                    to{" "}
                    <span className="font-medium text-foreground">{pendingStatusChange.nextStatus}</span>?
                  </>
                ) : (
                  "Confirm the fulfillment status update for this order."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={pendingStatusChange ? updatingIds.has(pendingStatusChange.orderId) : false}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={pendingStatusChange ? updatingIds.has(pendingStatusChange.orderId) : false}
                onClick={(e) => {
                  e.preventDefault();
                  void confirmStatusChange();
                }}
              >
                {pendingStatusChange && updatingIds.has(pendingStatusChange.orderId)
                  ? "Updating..."
                  : "Confirm change"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}
