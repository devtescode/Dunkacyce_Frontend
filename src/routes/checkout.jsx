import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Wallet, ArrowLeft } from "lucide-react";
import { formatNGN, DELIVERY_FEE } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";

const BASE = "http://localhost:5000";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Dunnkayce" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getSessionUser());
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState("Paystack");
  const [placing, setPlacing] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH + DELIVERY + CART FETCH
  useEffect(() => {
    const sessionUser = getSessionUser();

    if (!sessionUser) {
      navigate({ to: "/login" });
      return;
    }

    setUser(sessionUser);

    const raw = sessionStorage.getItem("dk_checkout");

    if (!raw) {
      navigate({ to: "/cart" });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
      setDelivery(parsed);
    } catch {
      navigate({ to: "/cart" });
      return;
    }

    fetchCart();
  }, [navigate]);

  // 📦 FETCH CART FROM BACKEND
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

      if (!res.ok) {
        toast.error(data.message || "Failed to load cart");
        return;
      }

      setCart(data.cart || []);
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !delivery) return null;

  // 💰 CALCULATIONS (SAFE)
  const subtotal = cart.reduce((s, i) => {
    const price = i.price || 0;
    const qty = i.quantity || 1;
    return s + price * qty;
  }, 0);

  const total = subtotal + DELIVERY_FEE;

  // 💳 PAY / PLACE ORDER
  const pay = async () => {
    try {
      setPlacing(true);

      const token = sessionStorage.getItem("token");

      const res = await fetch(
        `${BASE}/cart/initialize-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email,
            amount: total,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setPlacing(false);
        return toast.error(data.message);
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      setPlacing(false);
      toast.error("Unable to start payment");
    }
  };
  const options = [
    {
      id: "Paystack",
      title: "Paystack",
      desc: "Pay instantly with card, bank transfer or USSD.",
      icon: CreditCard,
    },
  ];

  // 🛒 LOADING STATE (keeps UI clean)
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </main>
    );
  }

  // 🛒 EMPTY CART
  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Nothing to pay for</h1>
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
      {/* UI UNCHANGED */}
      <button
        onClick={() => navigate({ to: "/cart" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </button>

      <h1 className="font-display text-4xl mb-2">Choose payment</h1>

      <p className="text-muted-foreground mb-6">
        Delivering to{" "}
        <strong className="text-foreground">{delivery.hostel}</strong> · Room{" "}
        <strong className="text-foreground">{delivery.room}</strong>
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-3">
          {options.map((o) => {
            const Icon = o.icon;
            const active = method === o.id;

            return (
              <button
                key={o.id}
                onClick={() => setMethod(o.id)}
                className={`w-full text-left flex gap-4 rounded-xl border-2 p-4 transition ${active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                  }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">{o.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {o.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT SUMMARY */}
        <aside className="rounded-xl border bg-card p-5 h-fit space-y-3">
          <h2 className="font-display text-2xl">Summary</h2>

          <ul className="text-sm space-y-1 border-b pb-3">
            {cart.map((i) => (
              <li
                key={i._id}
                className="flex justify-between gap-2"
              >
                <span className="text-muted-foreground">
                  {i.quantity}× {i.name}
                  {i.soup ? ` (${i.soup})` : ""}
                </span>
                <span>{formatNGN(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNGN(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatNGN(DELIVERY_FEE)}</span>
            </div>
          </div>

          <div className="flex justify-between border-t pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl text-primary">
              {formatNGN(total)}
            </span>
          </div>

          <button
            onClick={pay}
            disabled={placing}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
          >
            {placing ? "Processing…" : `Pay ${formatNGN(total)}`}
          </button>
        </aside>
      </div>
    </main>
  );
}