import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Receipt, X } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { usePaymentHistoryQuery } from "@/lib/api";
import { formatNGN } from "@/lib/store";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — DUNNKAYCE" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const paymentsQuery = usePaymentHistoryQuery(user?.id);
  const orders = paymentsQuery.data ?? [];

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setUser(sessionUser);
  }, [navigate]);

  useEffect(() => {
    if (!selectedOrder) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedOrder(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOrder]);

  if (!user) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Payments</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Payment history</h1>
        <p className="mt-2 text-sm text-muted-foreground">View your transactions and open receipts.</p>
      </div>

      {paymentsQuery.isPending ? (
        <div className="rounded-3xl border border-border bg-card p-8">
          <DunnkayceLoader variant="compact" label="Loading payments" caption="Fetching your payment history." />
        </div>
      ) : paymentsQuery.isError ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-bold">Could not load payments</p>
          <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
          <button onClick={() => paymentsQuery.refetch()} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
            <CreditCard className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight">No payments yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your successful payment receipts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => setSelectedOrder(order)}
              className="w-full rounded-[2rem] border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">#{String(order._id || "").slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{order.hostel} · Room {order.room}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-black text-primary">{formatNGN(Number(order.total || 0))}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={order.paymentStatus} />
                    <span className="text-xs text-muted-foreground">{order.paymentMethod || "—"}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Payment receipt"
            className="relative w-full max-w-md rounded-[2rem] bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close receipt"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Receipt className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-success">Transaction Receipt</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Payment details</h2>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Order ID" value={`#${String(selectedOrder._id || "").slice(-6).toUpperCase()}`} mono />
              <Row label="Date" value={formatDate(selectedOrder.createdAt)} />
              <Row label="Payment method" value={selectedOrder.paymentMethod || "—"} />
              <Row label="Status" value={selectedOrder.paymentStatus || "—"} valueClass={selectedOrder.paymentStatus === "Paid" ? "text-emerald-700 font-semibold" : ""} />
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Items purchased</p>
              <div className="mt-3 space-y-2">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{item.qty}× {item.name}</span>
                      {item.soupType ? ` (${item.soupType})` : ""}
                    </span>
                    <span className="font-semibold">{formatNGN(Number(item.price || 0) * Number(item.qty || 0))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-black text-primary">{formatNGN(Number(selectedOrder.total || 0))}</span>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/92"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, mono = false, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right text-foreground", mono && "font-mono text-xs sm:text-sm", valueClass)}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", styles)}>{status || "—"}</span>;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}