import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatNGN, DELIVERY_FEE } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import {
  ApiError,
  useCurrentUserCartQuery,
  useCreateOrderMutation,
  useInitializePaymentMutation,
} from "@/lib/api";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — DUNNKAYCE" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [placing, setPlacing] = useState(false);
  const [delivery, setDelivery] = useState(null);

  const { data: cartData, isPending } = useCurrentUserCartQuery();
  const createOrder = useCreateOrderMutation({ invalidateCart: false });
  const initializePayment = useInitializePaymentMutation();
  const cart = cartData || [];

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setUser(sessionUser);

    const raw = sessionStorage.getItem("dk_checkout");
    if (!raw) {
      navigate({ to: "/cart", replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.hostel || !parsed?.room) {
        navigate({ to: "/cart", replace: true });
        return;
      }
      setDelivery(parsed);
    } catch {
      navigate({ to: "/cart", replace: true });
    }
  }, [navigate]);

  if (!user || !delivery) return null;

  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
  const total = subtotal + DELIVERY_FEE;

  const pay = async () => {
    if (placing) return;
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      navigate({ to: "/cart" });
      return;
    }

    try {
      setPlacing(true);

      const formattedItems = cart.map((i) => ({
        foodId: i._id,
        name: i.name,
        price: i.price,
        qty: i.quantity,
        soupType: i.soup || null,
      }));

      const orderData = await createOrder.mutateAsync({
        userId: user.id,
        items: formattedItems,
        hostel: delivery.hostel,
        room: delivery.room,
        total,
        paymentMethod: "Paystack",
      });

      const reference = orderData?.reference;
      const data = await initializePayment.mutateAsync({
        email: user.email,
        amount: total,
        ...(reference ? { reference } : {}),
      });

      const authorizationUrl = data?.authorization_url || data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error("Payment authorization URL was not returned");
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      setPlacing(false);
      if (error instanceof ApiError) {
        toast.error(error.message || "Unable to start payment");
        return;
      }
      toast.error(error?.message || "Unable to start payment");
    }
  };

  if (isPending) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <DunnkayceLoader variant="page" label="Setting the table" caption="Getting your checkout ready." />
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-[2rem] border border-border bg-card p-10">
          <h1 className="text-3xl font-black tracking-tight">Nothing to pay for</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your cart is empty right now.</p>
          <button
            onClick={() => navigate({ to: "/user-dashboard" })}
            className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Browse menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate({ to: "/cart" })}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </button>

      <div className="mt-4 mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Checkout</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Secure your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivering to <span className="font-semibold text-foreground">{delivery.hostel}</span> · Room{" "}
          <span className="font-semibold text-foreground">{delivery.room}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">Paystack</h2>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Selected</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Pay instantly with card, bank transfer, or USSD through Paystack’s secure checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm font-semibold">Your payment is processed securely by Paystack.</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              After confirming, you’ll be redirected to complete payment. Your order details and delivery location are included below.
            </p>
          </div>
        </section>

        <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="text-2xl font-black tracking-tight">Order summary</h2>

          <ul className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
            {cart.map((item) => (
              <li key={item._id} className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{item.quantity}×</span> {item.name}
                  {item.soup ? ` (${item.soup})` : ""}
                </span>
                <span className="font-semibold">{formatNGN(Number(item.price || 0) * Number(item.quantity || 1))}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatNGN(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery fee</span>
              <span className="font-medium text-foreground">{formatNGN(DELIVERY_FEE)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-black text-primary">{formatNGN(total)}</span>
            </div>
          </div>

          <button
            onClick={pay}
            disabled={placing}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? "Processing..." : `Pay ${formatNGN(total)}`}
          </button>
        </aside>
      </div>
    </main>
  );
}