import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Search } from "lucide-react";
import { store, formatNGN } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Menu — Dunnkayce" }, { name: "description", content: "Browse today's menu of hot campus meals." }] }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const [foods, setFoods] = useState([]);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        store.syncUser(sessionUser);
        return;
      }
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetch("http://localhost:5000/food")
      .then((res) => res.json())
      .then((data) => {
        const backendFoods = Array.isArray(data.foods)
          ? data.foods.map((f) => ({
              ...f,
              id: f._id ?? f.id,
              image: f.imageUrl ?? f.image,
              imageUrl: f.imageUrl ?? f.image,
            }))
          : [];
        setFoods(backendFoods);
        store.setFoods(backendFoods);
      })
      .catch(() => toast.error("Failed to load menu"));
  }, []);

  if (!user) return null;

  const filtered = useMemo(() =>
    foods.filter((f) =>
      (cat === "All" || f.category === cat) &&
      f.name.toLowerCase().includes(q.toLowerCase())
    ), [foods, cat, q]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[oklch(0.55_0.18_30)] p-8 md:p-12 text-primary-foreground mb-8 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -left-8 -bottom-12 h-40 w-40 rounded-full bg-warning/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Flame className="h-3.5 w-3.5" /> Fresh today
          </div>
          <h1 className="font-display text-5xl md:text-6xl mt-3">Hey {user.fullName.split(" ")[0]},</h1>
          <p className="font-display text-3xl md:text-4xl opacity-90">what are you eating?</p>
          <p className="mt-3 max-w-md text-sm opacity-80">Browse the menu, fill your cart, pay, and we'll deliver straight to your hostel room.</p>
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex gap-2">
          {["All", "Foods", "Protein"].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${cat === c ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>{c}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals…" className="w-full sm:w-64 rounded-full border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:border-ring" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((f) => (
          <FoodCard key={f._id} food={f} left={f.dailyLimit} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">No meals found.</div>
        )}
      </div>
    </main>
  );
}

function FoodCard({ food, left }) {
  const [soup, setSoup] = useState("Egusi");
  const disabled = food.status !== "Available" || left <= 0;

  const add = () => {
    if (disabled) return toast.error(left <= 0 ? "Daily limit reached" : `Currently ${food.status}`);
    const foodId = food._id ?? food.id;
    store.addToCart(foodId, 1, food.isSwallow ? soup : undefined);
    toast.success(`${food.name} added to cart`);
  };

  const statusColor = food.status === "Available"
    ? "bg-success/15 text-success"
    : food.status === "Preparing"
    ? "bg-warning/20 text-warning-foreground"
    : "bg-destructive/15 text-destructive";

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={food.imageUrl}
          alt={food.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Food"; }}
        />
        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>{food.status}</span>
        <span className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold">{food.category}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{food.name}</h3>
          <span className="font-display text-xl text-primary">{formatNGN(food.price)}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">You can still order {Math.max(0, left)} of {food.dailyLimit} today</div>

        {food.isSwallow && (
          <div className="mt-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Soup</label>
            <select value={soup} onChange={(e) => setSoup(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option>Egusi</option><option>Okra</option><option>Vegetable</option>
            </select>
          </div>
        )}

        <button onClick={add} disabled={disabled} className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
          <Plus className="h-4 w-4" /> Add to cart
        </button>
      </div>
    </article>
  );
}
