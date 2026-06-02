import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { store, useStore, formatNGN, HOSTELS, DELIVERY_FEE } from "@/lib/store";
import { toast } from "sonner";
export const Route = createFileRoute("/cart")({
    head: () => ({ meta: [{ title: "Cart — Dunnkayce" }] }),
    component: CartPage,
});
function CartPage() {
    const navigate = useNavigate();
    const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
    const cart = useStore((s) => s.cart);
    const foods = useStore((s) => s.foods);
    const [hostel, setHostel] = useState(HOSTELS[0]);
    const [room, setRoom] = useState("");
    useEffect(() => { if (!user)
        navigate({ to: "/login" }); }, [user, navigate]);
    if (!user)
        return null;
    const items = cart.map((c) => ({ ...c, food: foods.find((f) => f.id === c.foodId) })).filter((i) => i.food);
    const subtotal = items.reduce((s, i) => s + i.food.price * i.qty, 0);
    const total = subtotal + DELIVERY_FEE;
    const continueToPayment = () => {
        if (!room.trim())
            return toast.error("Enter your room number");
        sessionStorage.setItem("dk_checkout", JSON.stringify({ hostel, room: room.trim() }));
        navigate({ to: "/checkout" });
    };
    if (items.length === 0) {
        return (<main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50"/>
        <h1 className="font-display text-4xl mt-4">Your cart is empty</h1>
        <p className="text-muted-foreground mt-1">Add some delicious meals to get started.</p>
        <button onClick={() => navigate({ to: "/" })} className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Browse menu</button>
      </main>);
    }
    return (<main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((i) => (<div key={i.foodId + (i.soupType ?? "")} className="flex gap-4 rounded-xl border bg-card p-3">
              <img src={i.food.image} alt={i.food.name} className="h-24 w-24 rounded-lg object-cover"/>
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{i.food.name}</h3>
                    {i.soupType && <p className="text-xs text-muted-foreground">Soup: {i.soupType}</p>}
                    <p className="text-sm text-primary font-semibold mt-0.5">{formatNGN(i.food.price)}</p>
                  </div>
                  <button onClick={() => store.updateCartQty(i.foodId, 0, i.soupType)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4"/></button>
                </div>
                <div className="mt-3 inline-flex items-center rounded-lg border">
                  <button onClick={() => store.updateCartQty(i.foodId, i.qty - 1, i.soupType)} className="px-2.5 py-1.5 hover:bg-secondary"><Minus className="h-3.5 w-3.5"/></button>
                  <span className="px-3 text-sm font-semibold min-w-8 text-center">{i.qty}</span>
                  <button onClick={() => store.updateCartQty(i.foodId, i.qty + 1, i.soupType)} className="px-2.5 py-1.5 hover:bg-secondary"><Plus className="h-3.5 w-3.5"/></button>
                </div>
              </div>
            </div>))}
        </div>

        <aside className="rounded-xl border bg-card p-5 h-fit sticky top-20 space-y-4">
          <h2 className="font-display text-2xl">Delivery</h2>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Hostel</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={hostel} onChange={(e) => setHostel(e.target.value)}>
              {HOSTELS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Room number</label>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 204"/>
          </div>
          <div className="border-t pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNGN(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>{formatNGN(DELIVERY_FEE)}</span></div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-2xl text-primary">{formatNGN(total)}</span>
            </div>
            <button onClick={continueToPayment} className="mt-3 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition">Order</button>
          </div>
        </aside>
      </div>
    </main>);
}
