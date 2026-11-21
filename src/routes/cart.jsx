import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatNGN, HOSTELS, DELIVERY_FEE } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import {
  useCurrentUserCartQuery,
  useUpdateCartQtyMutation,
  useRemoveFromCartMutation,
} from "@/lib/api";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — DUNNKAYCE" }] }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [hostel, setHostel] = useState(HOSTELS[0]);
  const [room, setRoom] = useState("");
  const [pendingItemId, setPendingItemId] = useState(null);

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        return;
      }
      navigate({ to: "/login", replace: true });
    }
  }, [user, navigate]);

  const cartQuery = useCurrentUserCartQuery();
  const { mutateAsync: updateCartQty } = useUpdateCartQtyMutation();
  const { mutateAsync: removeFromCart } = useRemoveFromCartMutation();

  const cart = cartQuery.data ?? [];
  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0);
  const total = subtotal + DELIVERY_FEE;

  if (!user) return null;

  const updateQty = async (id, qty) => {
    try {
      setPendingItemId(id);
      await updateCartQty({ cartId: id, quantity: qty });
    } catch (err) {
      toast.error(err?.status ? err.message : "Network error");
    } finally {
      setPendingItemId(null);
    }
  };

  const removeItem = async (id) => {
    try {
      setPendingItemId(id);
      await removeFromCart(id);
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(err?.status ? err.message : "Network error");
    } finally {
      setPendingItemId(null);
    }
  };

  const continueToPayment = () => {
    if (!room.trim()) {
      toast.error("Enter your room number");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    sessionStorage.setItem(
      "dk_checkout",
      JSON.stringify({ hostel, room: room.trim(), subtotal, total }),
    );
    navigate({ to: "/checkout" });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Your Cart</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Ready for checkout?</h1>
      </div>

      {cartQuery.isPending ? (
        <div className="rounded-3xl border border-border bg-card p-8">
          <DunnkayceLoader variant="compact" label="Loading your cart..." caption="Gathering your picks from the kitchen." />
        </div>
      ) : cartQuery.isError ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-lg font-bold">Could not load your cart</p>
          <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
          <button onClick={() => cartQuery.refetch()} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
        </div>
      ) : cart.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight">Your cart is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add some delicious meals to get started.</p>
          <button
            onClick={() => navigate({ to: "/user-dashboard" })}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Browse menu <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cart.map((item) => {
              const busy = pendingItemId === item._id;
              return (
                <article key={item._id} className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"}
                    alt={item.name || "Cart item"}
                    className="h-28 w-28 rounded-2xl object-cover bg-muted"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                        {item.soup && <p className="mt-1 text-sm text-muted-foreground">Soup: {item.soup}</p>}
                        <p className="mt-2 text-base font-black text-primary">{formatNGN(item.price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        disabled={busy}
                        className="rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 inline-flex items-center rounded-2xl border border-border bg-background p-1">
                      <button
                        onClick={() => updateQty(item._id, Math.max(1, Number(item.quantity || 1) - 1))}
                        disabled={busy || Number(item.quantity || 1) <= 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item._id, Number(item.quantity || 1) + 1)}
                        disabled={busy}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Delivery</h2>
                <p className="text-sm text-muted-foreground">Where should we bring it?</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Hostel</span>
                <select
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                >
                  {HOSTELS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Room number</span>
                <input
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. A12"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
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
              onClick={continueToPayment}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/92"
            >
              Continue to Checkout <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}