import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, formatNGN } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { ShoppingBag, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Dunnkayce" }] }),
  component: OrdersPage,
});

const STATUS_STEPS = ["Pending", "Preparing", "Ready", "Delivered"];
const BASE = "http://localhost:5000";

function OrdersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        return;
      }
      navigate({ to: "/login" });
      return;
    }
    fetch(`${BASE}/orders/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        Loading your orders...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Orders History</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="h-9 w-9 text-primary/60" />
          </div>
          <div>
            <p className="text-xl font-semibold">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Looks like your stomach hasn't spoken yet. Browse the menu and place your first order!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <ShoppingBag className="h-4 w-4" /> Browse menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const stepIdx = STATUS_STEPS.indexOf(o.status);
            return (
              <article key={o._id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      #{o._id.slice(-6).toUpperCase()} · {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <p className="font-semibold mt-1">{o.hostel} — Room {o.room}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.paymentMethod} ·{" "}
                      <span className={
                        o.paymentStatus === "Paid" ? "text-success font-semibold" :
                        o.paymentStatus === "Pending" ? "text-warning-foreground" :
                        "text-destructive"
                      }>{o.paymentStatus}</span>
                    </p>
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
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.qty}× {it.name}
                      {it.soupType ? ` (${it.soupType})` : ""}
                      <span className="float-right">{formatNGN(it.price * it.qty)}</span>
                    </li>
                  ))}
                  {o.deliveryFee ? (
                    <li className="text-xs pt-1">
                      Delivery fee <span className="float-right">{formatNGN(o.deliveryFee)}</span>
                    </li>
                  ) : null}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
