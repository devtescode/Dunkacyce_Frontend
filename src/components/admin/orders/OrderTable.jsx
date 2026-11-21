import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Lock,
  Receipt,
  Unlock,
} from "lucide-react";
import { StatusPill } from "@/components/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatOrderDateTime,
  getDeliveryEvidence,
  getDisplayStatus,
  getLateElapsedMs,
  normalizeStatus,
} from "@/lib/orderTracking";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";
import DeliveryEvidenceBadge from "./DeliveryEvidenceBadge";
import StudentProfileCard from "./StudentProfileCard";

const STATUS_OPTIONS = ["Pending", "Preparing", "Ready", "Delivered"];

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function invoke(callback, ...args) {
  if (typeof callback === "function") callback(...args);
}

function getOrderId(order) {
  return text(order?._id) || text(order?.id);
}

function getShortOrderId(order) {
  const id = getOrderId(order);
  return id ? `#${id.slice(-6).toUpperCase()}` : "#—";
}

function formatMoney(value) {
  const amount = Number(value);
  return formatNGN(Number.isFinite(amount) ? amount : 0);
}

function getDestination(order) {
  const hostel = text(order?.hostel) || "—";
  const room = text(order?.room);
  return room ? `${hostel} · Room ${room}` : `${hostel} · Room —`;
}

function hasId(collection, id) {
  if (!id || collection == null) return false;
  if (typeof collection.has === "function") {
    return collection.has(id) || collection.has(String(id));
  }
  if (Array.isArray(collection)) {
    return collection.some((value) => String(value) === String(id));
  }
  if (typeof collection === "object") {
    return Object.prototype.hasOwnProperty.call(collection, id);
  }
  return false;
}

function isLateOrder(order, now) {
  if (!order || typeof order !== "object") return false;
  try {
    const current = Number.isFinite(now) ? now : Date.now();
    const evidence = getDeliveryEvidence(order, current);
    if (evidence?.verdict === "late") return true;
    return Number(getLateElapsedMs(order, current)) > 0;
  } catch {
    return false;
  }
}

function getStatusTone(status) {
  switch (text(status).toLowerCase()) {
    case "delivered":
      return "fresh";
    case "ready":
    case "on the way":
      return "blue";
    case "preparing":
      return "gold";
    default:
      return "neutral";
  }
}

function FulfillmentPill({ status }) {
  // `status` is supplied for status-aware kit variants; children/tone keep the
  // pill readable with the current presentational kit as well.
  return (
    <StatusPill status={status} tone={getStatusTone(status)}>
      {status}
    </StatusPill>
  );
}

function PaymentPill({ paymentStatus }) {
  const label = text(paymentStatus) || "Unpaid";
  const isPaid = label.toLowerCase() === "paid";
  return (
    <StatusPill tone={isPaid ? "fresh" : "neutral"} dot={false}>
      {isPaid ? "Paid" : label}
    </StatusPill>
  );
}

function LateFlag({ small = false }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 font-semibold uppercase tracking-wide text-destructive",
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <AlertTriangle aria-hidden="true" className="h-3 w-3 shrink-0" />
      Late
    </span>
  );
}

function FulfillmentActions({
  order,
  orderId,
  shortId,
  unlocked,
  isUpdating,
  onToggleUnlock,
  onChangeStatus,
  onDeliveredAttempt,
  onOpenDetails,
  className,
}) {
  const normalizedStatus = normalizeStatus(order);
  const isDelivered = normalizedStatus === "Delivered";
  const currentStatus = STATUS_OPTIONS.includes(normalizedStatus) ? normalizedStatus : undefined;
  const LockIcon = unlocked ? Unlock : Lock;
  const locked = !unlocked;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {isDelivered ? (
        <button
          type="button"
          onClick={() => invoke(onDeliveredAttempt, order)}
          aria-label={`Order ${shortId} has already been delivered`}
          title="This order has already been delivered"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
          Delivered · locked
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => invoke(onToggleUnlock, orderId)}
            disabled={!orderId || isUpdating}
            aria-pressed={unlocked}
            aria-label={`${unlocked ? "Lock" : "Unlock"} status control for order ${shortId}`}
            title={unlocked ? "Lock status control" : "Unlock status control"}
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
              unlocked && "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            <LockIcon aria-hidden="true" className="h-3.5 w-3.5" />
          </button>

          <Select
            value={currentStatus}
            onValueChange={(value) => invoke(onChangeStatus, order, value)}
            disabled={locked || !orderId || isUpdating}
          >
            <SelectTrigger
              aria-label={`Update status for order ${shortId}`}
              aria-busy={isUpdating}
              className="h-8 w-[132px] rounded-lg text-xs"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {isUpdating ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground"
                  />
                ) : null}
                <SelectValue />
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
        </>
      )}

      <button
        type="button"
        onClick={() => invoke(onOpenDetails, order)}
        aria-label={`Open details for order ${shortId}`}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
      >
        <Receipt aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
        Details
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

const HEAD_CELL =
  "sticky top-0 z-10 whitespace-nowrap bg-muted/90 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur";
const BODY_CELL = "px-4 py-3 align-middle text-sm text-foreground";

export function OrderTable({
  rows,
  now = Date.now(),
  showPii = false,
  getProfile,
  updatingIds,
  unlockedIds,
  onToggleUnlock,
  onChangeStatus,
  onDeliveredAttempt,
  onOpenDetails,
}) {
  const safeRows = (Array.isArray(rows) ? rows : []).filter(
    (order) => order && typeof order === "object",
  );
  const current = Number.isFinite(now) ? now : Date.now();
  const revealPii = Boolean(showPii);
  const profileFor = (order) =>
    typeof getProfile === "function" ? getProfile(order) : undefined;
  const studentFor = (order) => {
    const value = order?.userId;
    if (value && typeof value === "object") return value;
    return order?.user ?? value;
  };

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={cn(HEAD_CELL, "w-[180px]")}>
                  Order
                </th>
                <th scope="col" className={cn(HEAD_CELL, "min-w-[270px]")}>
                  Student
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Destination
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Status
                </th>
                <th scope="col" className={cn(HEAD_CELL, "min-w-[180px]")}>
                  ETA
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Amount
                </th>
                <th scope="col" className={cn(HEAD_CELL, "min-w-[310px]")}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {safeRows.map((order, index) => {
                const orderId = getOrderId(order);
                const shortId = getShortOrderId(order);
                const reference = text(order.reference) || "—";
                const placedAt = formatOrderDateTime(order.createdAt ?? order.paidAt);
                const displayStatus = getDisplayStatus(order, current);
                const isLate = isLateOrder(order, current);
                const unlocked = hasId(unlockedIds, orderId);
                const isUpdating = hasId(updatingIds, orderId);

                return (
                  <tr
                    key={orderId || `order-${index}`}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      isLate && "bg-destructive/[0.03]",
                    )}
                  >
                    <td
                      className={cn(
                        BODY_CELL,
                        "border-l-2",
                        isLate ? "border-l-destructive" : "border-l-transparent",
                      )}
                    >
                      <p className="font-semibold tabular-nums text-foreground">{shortId}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground" title={reference}>
                        Ref {reference}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Placed {placedAt}</p>
                    </td>
                    <td className={BODY_CELL}>
                      <StudentProfileCard
                        student={studentFor(order)}
                        profile={profileFor(order)}
                        variant="compact"
                        mask={!revealPii}
                      />
                    </td>
                    <td className={cn(BODY_CELL, "whitespace-nowrap")}>{getDestination(order)}</td>
                    <td className={BODY_CELL}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <FulfillmentPill status={displayStatus} />
                        <PaymentPill paymentStatus={order.paymentStatus} />
                        {isLate ? <LateFlag small /> : null}
                      </div>
                    </td>
                    <td className={BODY_CELL}>
                      <DeliveryEvidenceBadge order={order} now={current} />
                    </td>
                    <td className={cn(BODY_CELL, "whitespace-nowrap font-semibold tabular-nums")}>
                      {formatMoney(order.total)}
                    </td>
                    <td className={BODY_CELL}>
                      <FulfillmentActions
                        order={order}
                        orderId={orderId}
                        shortId={shortId}
                        unlocked={unlocked}
                        isUpdating={isUpdating}
                        onToggleUnlock={onToggleUnlock}
                        onChangeStatus={onChangeStatus}
                        onDeliveredAttempt={onDeliveredAttempt}
                        onOpenDetails={onOpenDetails}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {safeRows.map((order, index) => {
          const orderId = getOrderId(order);
          const shortId = getShortOrderId(order);
          const reference = text(order.reference) || "—";
          const placedAt = formatOrderDateTime(order.createdAt ?? order.paidAt);
          const displayStatus = getDisplayStatus(order, current);
          const isLate = isLateOrder(order, current);
          const unlocked = hasId(unlockedIds, orderId);
          const isUpdating = hasId(updatingIds, orderId);

          return (
            <article
              key={orderId || `order-card-${index}`}
              className={cn(
                "rounded-2xl border border-border/70 bg-card p-4 shadow-sm",
                isLate && "border-l-2 border-l-destructive",
              )}
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg tracking-tight text-foreground">
                      {shortId}
                    </h3>
                    {isLate ? <LateFlag /> : null}
                  </div>
                  <p className="truncate font-mono text-[11px] text-muted-foreground" title={reference}>
                    Ref {reference}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Placed {placedAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-0.5 font-display text-xl tabular-nums text-foreground">
                    {formatMoney(order.total)}
                  </p>
                </div>
              </header>

              <div className="mt-3">
                <StudentProfileCard
                  student={studentFor(order)}
                  profile={profileFor(order)}
                  variant="compact"
                  mask={!revealPii}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <FulfillmentPill status={displayStatus} />
                <PaymentPill paymentStatus={order.paymentStatus} />
              </div>

              <p className="mt-3 text-sm text-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Destination:{" "}
                </span>
                {getDestination(order)}
              </p>

              <div className="mt-3">
                <DeliveryEvidenceBadge order={order} now={current} variant="full" />
              </div>

              <div className="mt-4 border-t border-border/60 pt-3">
                <FulfillmentActions
                  order={order}
                  orderId={orderId}
                  shortId={shortId}
                  unlocked={unlocked}
                  isUpdating={isUpdating}
                  onToggleUnlock={onToggleUnlock}
                  onChangeStatus={onChangeStatus}
                  onDeliveredAttempt={onDeliveredAttempt}
                  onOpenDetails={onOpenDetails}
                  className="w-full"
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTable;
