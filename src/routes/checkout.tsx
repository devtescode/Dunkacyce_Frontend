import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Wallet, ArrowLeft } from "lucide-react";
import { store, useStore, formatNGN, DELIVERY_FEE, type PaymentMethod } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Dunnkayce" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const cart = useStore((s) => s.cart);
  const foods = useStore((s) => s.foods);
  const [method, setMethod] = useState<PaymentMethod>("Paystack");
  const [placing, setPlacing] = useState(false);
  const [delivery, setDelivery] = useState<{ hostel: string; room: string } | null>(null);

  useEffect(() => {
    if (!user) { navigate({ to: "/login" }); return; }
    const raw = sessionStorage.getItem("dk_checkout");
    if (!raw) { navigate({ to: "/cart" }); return; }
    try { setDelivery(JSON.parse(raw)); } catch { navigate({ to: "/cart" }); }
  }, [user, navigate]);

  if (!user || !delivery) return null;
  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Nothing to pay for</h1>
        <button onClick={() => navigate({ to: "/" })} className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Browse menu</button>
      </main>
    );
  }

  const items = cart.map((c) => ({ ...c, food: foods.find((f) => f.id === c.foodId)! })).filter((i) => i.food);
  const subtotal = items.reduce((s, i) => s + i.food.price * i.qty, 0);
  const total = subtotal + DELIVERY_FEE;

  const pay = () => {
    setPlacing(true);
    setTimeout(() => {
      const result = store.createOrder({ hostel: delivery.hostel, room: delivery.room, paymentMethod: method });
      setPlacing(false);
      if ("error" in result) return toast.error(result.error);
      sessionStorage.removeItem("dk_checkout");
      toast.success(method === "Paystack" ? "Payment successful! Order placed." : "Order placed. Awaiting payment verification.");
      navigate({ to: "/orders" });
    }, method === "Paystack" ? 800 : 200);
  };

  const options: { id: PaymentMethod; title: string; desc: string; icon: typeof CreditCard }[] = [
    { id: "Paystack", title: "Paystack", desc: "Pay instantly with card, bank transfer or USSD.", icon: CreditCard },
    { id: "Moniepoint", title: "Moniepoint", desc: "Send manually to our Moniepoint account. Admin will verify.", icon: Wallet },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <button onClick={() => navigate({ to: "/cart" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </button>
      <h1 className="font-display text-4xl mb-2">Choose payment</h1>
      <p className="text-muted-foreground mb-6">Delivering to <strong className="text-foreground">{delivery.hostel}</strong> · Room <strong className="text-foreground">{delivery.room}</strong></p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {options.map((o) => {
            const Icon = o.icon;
            const active = method === o.id;
            return (
              <button key={o.id} onClick={() => setMethod(o.id)} className={`w-full text-left flex gap-4 rounded-xl border-2 p-4 transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{o.title}</h3>
                    {active && <span className="text-xs font-semibold text-primary">Selected</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{o.desc}</p>
                </div>
              </button>
            );
          })}

          {method === "Moniepoint" && (
            <div className="rounded-xl border border-dashed bg-warning/10 p-4 text-sm">
              <p className="font-semibold mb-1">Manual transfer details</p>
              <p className="text-muted-foreground">Send <strong className="text-foreground">{formatNGN(total)}</strong> to:</p>
              <p className="mt-2 font-mono">Moniepoint · <strong>1234567890</strong> · Dunnkayce Kitchen</p>
              <p className="mt-2 text-xs text-muted-foreground">After payment, click "Place order" below. Our admin will confirm and your order status will move to Preparing.</p>
            </div>
          )}
        </div>

        <aside className="rounded-xl border bg-card p-5 h-fit space-y-3">
          <h2 className="font-display text-2xl">Summary</h2>
          <ul className="text-sm space-y-1 border-b pb-3">
            {items.map((i) => (
              <li key={i.foodId + (i.soupType ?? "")} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{i.qty}× {i.food.name}{i.soupType ? ` (${i.soupType})` : ""}</span>
                <span>{formatNGN(i.food.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNGN(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>{formatNGN(DELIVERY_FEE)}</span></div>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl text-primary">{formatNGN(total)}</span>
          </div>
          <button onClick={pay} disabled={placing} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60">
            {placing ? "Processing…" : method === "Paystack" ? `Pay ${formatNGN(total)}` : "Place order"}
          </button>
        </aside>
      </div>
    </main>
  );
}
