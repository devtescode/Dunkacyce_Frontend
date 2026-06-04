import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/session";
import { ShoppingBag, UtensilsCrossed, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Dunnkayce" }] }),
  component: OrdersPage,
});

const BASE = "https://dunkacyce-backend.onrender.com";

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
      } else {
        navigate({ to: "/login" });
      }
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
      <main className="text-center py-20 text-gray-500">
        Loading your orders...
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Orders History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="mx-auto mb-3 text-gray-400" />
          <p>No successful payments yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <div key={o._id} className="border rounded-xl p-4 bg-white shadow-sm">

              {/* SUCCESS BADGE */}
              <div className="flex items-center gap-2 mb-3 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Payment Successful
              </div>

              {/* ORDER HEADER */}
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    #{o._id.slice(-6)}
                  </p>
                  <p className="font-semibold">
                    {o.hostel} - Room {o.room}
                  </p>
                </div>

                <p className="font-bold text-lg">
                  ₦{o.total}
                </p>
              </div>

              {/* ITEMS */}
              <div className="mt-4 space-y-2">
                {o.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span>₦{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="mt-3 text-xs text-gray-500">
                Paid via {o.paymentMethod}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}