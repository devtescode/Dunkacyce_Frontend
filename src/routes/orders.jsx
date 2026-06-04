import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/session";
import { ShoppingBag, UtensilsCrossed, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Dunnkayce" }] }),
  component: OrdersPage,
});

// const BASE = "http://localhost:5000";
const BASE = "https://dunkacyce-backend.onrender.com";

function OrdersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (!sessionUser) {
        navigate({ to: "/login" });
        return;
      }
      setUser(sessionUser);
      return;
    }

    fetch(`${BASE}/orders/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <main className="text-center py-16 text-muted-foreground">
        Loading orders...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Orders History</h1>

      {orders.length === 0 ? (
        <div className="text-center p-10 border rounded-xl">
          <UtensilsCrossed className="mx-auto mb-3" />
          <p>No orders yet</p>
          <Link to="/" className="text-blue-500">Browse Menu</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="border rounded-xl p-4 bg-card">
              
              {/* HEADER */}
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    #{o._id.slice(-6)} · {new Date(o.createdAt).toLocaleString()}
                  </p>

                  <p className="font-semibold">{o.hostel} - Room {o.room}</p>

                  <p className="text-sm mt-1">
                    Payment:
                    <span className={`ml-2 font-semibold ${
                      o.paymentStatus === "Paid"
                        ? "text-green-600"
                        : "text-yellow-500"
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </p>
                </div>

                {/* AMOUNT PAID */}
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    ₦{o.total}
                  </p>

                  {o.paymentStatus === "Paid" && (
                    <p className="text-green-600 flex items-center gap-1 text-sm">
                      <CheckCircle size={14} />
                      Paid Successfully
                    </p>
                  )}
                </div>
              </div>

              {/* ITEMS */}
              <div className="mt-4 border-t pt-3">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {it.qty}× {it.name}
                    </span>
                    <span>₦{it.price * it.qty}</span>
                  </div>
                ))}
              </div>

              {/* PAYMENT REF */}
              {o.reference && (
                <p className="text-xs text-muted-foreground mt-2">
                  Ref: {o.reference}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}