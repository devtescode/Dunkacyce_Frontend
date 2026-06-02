import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore, formatNGN, type OrderStatus } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Dunnkayce" }] }),
  component: OrdersPage,
});

const STATUS_STEPS: OrderStatus[] = ["Pending", "Preparing", "Ready", "Delivered"];

function OrdersPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const orders = useStore((s) => (user ? s.orders.filter((o) => o.userId === user.id) : []));
  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  if (!user) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No orders yet. <Link to="/" className="text-primary font-semibold">Order now →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const stepIdx = STATUS_STEPS.indexOf(o.status);
            return (
              <article key={o.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">#{o.id.slice(-6).toUpperCase()} · {new Date(o.createdAt).toLocaleString()}</p>
                    <p className="font-semibold mt-1">{o.hostel} — Room {o.room}</p>
                    <p className="text-xs text-muted-foreground">{o.paymentMethod} · <span className={o.paymentStatus === "Paid" ? "text-success font-semibold" : o.paymentStatus === "Pending" ? "text-warning-foreground" : "text-destructive"}>{o.paymentStatus}</span></p>
                  </div>
                  <span className="font-display text-2xl text-primary">{formatNGN(o.total)}</span>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className={`flex-1 h-1.5 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-secondary"}`} />
                      <span className={`ml-1.5 mr-1.5 text-[11px] font-medium ${i <= stepIdx ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                    </div>
                  ))}
                </div>

                <ul className="text-sm text-muted-foreground space-y-1 border-t pt-3">
                  {o.items.map((it, i) => <li key={i}>{it.qty}× {it.name} <span className="float-right">{formatNGN(it.price * it.qty)}</span></li>)}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
