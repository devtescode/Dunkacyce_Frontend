import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Lock,
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAdminOrdersQuery } from "@/lib/api";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management – Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const STATUS_OPTIONS = ["Preparing", "Ready", "Delivered"];

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
            <StatusBadge status={order?.status || "Unknown"} />
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

          <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            Fulfillment status is shown read-only. Status updates stay disabled until the backend endpoint is deployed.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FulfillmentControl({ order }) {
  const currentStatus = order?.status || "Preparing";

  return (
    <div className="w-full space-y-2 sm:max-w-[280px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Fulfillment status
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
        <StatusPill tone={getStatusToneName(currentStatus)}>{currentStatus}</StatusPill>
        <Lock aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Status updates unavailable — backend endpoint not deployed. This status is read-only.
      </p>
      <p className="text-xs text-muted-foreground">Placed {formatDate(order?.createdAt)}</p>
    </div>
  );
}

function OrderCard({ order }) {
  const items = getItems(order);
  const visibleItems = items.slice(0, 3);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);
  const status = order?.status || "Preparing";

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
          <FulfillmentControl order={order} />
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const allOrders = Array.isArray(data) ? data : [];

  // ONLY PAID ORDERS
  const orders = allOrders.filter((o) => o?.paymentStatus === "Paid");

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0);
    const preparing = orders.filter((order) => order?.status === "Preparing").length;
    const ready = orders.filter((order) => order?.status === "Ready").length;
    const delivered = orders.filter((order) => order?.status === "Delivered").length;
    const paidStudentIds = new Set();
    const studentsToDeliverIds = new Set();
    orders.forEach((order) => {
      const studentKey = getStudentKey(order);
      if (!studentKey) return;
      paidStudentIds.add(studentKey);
      if (order?.status !== "Delivered") {
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
      description="Review successful payments and current order progress in one operations view. Status changes are unavailable until the backend endpoint is deployed."
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
                label="Sort paid orders"
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
              return <OrderCard key={id || `order-${index}`} order={order} />;
            })}
          </section>
        )}
      </div>
    </AdminShell>
  );
}
