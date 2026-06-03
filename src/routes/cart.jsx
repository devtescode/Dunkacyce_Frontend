import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatNGN, HOSTELS, DELIVERY_FEE } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";

const BASE = "http://localhost:5000";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Dunnkayce" }] }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hostel, setHostel] = useState(HOSTELS[0]);
  const [room, setRoom] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        return;
      }
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  // 🔥 FETCH CART FROM BACKEND
  const fetchCart = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const res = await fetch(`${BASE}/cart/getusercart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setCart(data.cart || []);
      } else {
        toast.error(data.message || "Failed to load cart");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (!user) return null;

  const subtotal = cart.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  const total = subtotal + DELIVERY_FEE;

  // ➕ UPDATE QTY
  const updateQty = async (id, qty) => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${BASE}/cart/updatecartqty`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartId: id, quantity: qty }),
      });

      const data = await res.json();

      if (!res.ok) return toast.error(data.message);

      fetchCart(); // refresh
    } catch (err) {
      toast.error("Network error");
    }
  };

  // 🗑 DELETE ITEM
  const removeItem = async (id) => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${BASE}/cart/removefromcart/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return toast.error(data.message);

      toast.success("Removed from cart");
      fetchCart();
    } catch (err) {
      toast.error("Network error");
    }
  };
  
 const continueToPayment = () => {
    if (!room.trim()) return toast.error("Enter your room number");

    const checkoutData = {
      hostel,
      room: room.trim(),
      subtotal,
      total,
    };

    sessionStorage.setItem("dk_checkout", JSON.stringify(checkoutData));

    navigate({ to: "/checkout" });
  };

  // 🛒 EMPTY CART
  if (!loading && cart.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50" />
        <h1 className="font-display text-4xl mt-4">Your cart is empty</h1>
        <p className="text-muted-foreground mt-1">
          Add some delicious meals to get started.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Browse menu
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CART LIST */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading cart...</p>
          ) : (
            cart.map((i) => (
              <div
                key={i._id}
                className="flex gap-4 rounded-xl border bg-card p-3"
              >
                <img
                  src={i.imageUrl}
                  alt={i.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{i.name}</h3>

                      {i.soup && (
                        <p className="text-xs text-muted-foreground">
                          Soup: {i.soup}
                        </p>
                      )}

                      <p className="text-sm text-primary font-semibold mt-0.5">
                        {formatNGN(i.price)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(i._id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* QUANTITY CONTROL (BACKEND POWERED) */}
                  <div className="mt-3 inline-flex items-center rounded-lg border">
                    <button
                      onClick={() =>
                        updateQty(i._id, Math.max(1, i.quantity - 1))
                      }
                      className="px-2.5 py-1.5 hover:bg-secondary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>

                    <span className="px-3 text-sm font-semibold">
                      {i.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQty(i._id, i.quantity + 1)
                      }
                      className="px-2.5 py-1.5 hover:bg-secondary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SUMMARY */}
        <aside className="rounded-xl border bg-card p-5 h-fit sticky top-20 space-y-4">
          <h2 className="font-display text-2xl">Delivery</h2>

          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={hostel}
            onChange={(e) => setHostel(e.target.value)}
          >
            {HOSTELS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>

          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room number"
          />

          <div className="border-t pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNGN(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatNGN(DELIVERY_FEE)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t mt-2">
              <span>Total</span>
              <span className="font-display text-2xl text-primary">
                {formatNGN(total)}
              </span>
            </div>

            <button
              onClick={continueToPayment}
              className="mt-3 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground"
            >
              Order
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}