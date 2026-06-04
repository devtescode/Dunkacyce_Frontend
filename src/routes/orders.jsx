import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/session";
import {
  ShoppingBag,
  UtensilsCrossed,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [{ title: "My Orders — Dunnkayce" }],
  }),
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
        <div className="rounded-2xl border bg-white p-16 text-center flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
            <UtensilsCrossed className="h-9 w-9 text-orange-500" />
          </div>

          <div>
            <p className="text-xl font-semibold">
              No successful payments yet
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Once you complete an order successfully, it will appear here.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <div
              key={o._id}
              className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition"
            >
              {/* SUCCESS BADGE */}
              <div className="flex items-center gap-2 mb-3 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Payment Successful
              </div>

              {/* ORDER HEADER */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order #{o._id.slice(-6).toUpperCase()}
                  </p>

                  <p className="font-semibold">
                    {o.hostel} - Room {o.room}
                  </p>
                </div>

                <p className="font-bold text-xl text-orange-600">
                  ₦{Number(o.total).toLocaleString()}
                </p>
              </div>

              {/* ITEMS */}
              <div className="mt-4 space-y-2 border-t pt-3">
                {o.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.qty}× {item.name}
                      {item.soupType
                        ? ` (${item.soupType})`
                        : ""}
                    </span>

                    <span>
                      ₦
                      {(
                        Number(item.price) * Number(item.qty)
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="mt-4 border-t pt-3 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500">
                <span>
                  Paid via <strong>{o.paymentMethod}</strong>
                </span>

                <span>
                  {new Date(
                    o.paidAt || o.createdAt
                  ).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}