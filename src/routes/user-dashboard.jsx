import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Search } from "lucide-react";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";

// const BASE = "http://localhost:5000";
const BASE = "https://dunkacyce-backend.onrender.com";

const normalizeFood = (food) => ({
  ...food,
  id: food._id ?? food.id,
  image: food.imageUrl ?? food.image ?? "",
  description: food.description ?? food.name ?? "",
  category: food.category ?? "Foods",
  dailyLimit:
    typeof food.dailyLimit === "number"
      ? food.dailyLimit
      : food.category === "Protein"
        ? 3
        : 10,
});

export const Route = createFileRoute("/user-dashboard")({
  head: () => ({
    meta: [
      { title: "Menu — Dunnkayce" },
      {
        name: "description",
        content: "Browse today's menu of hot campus meals.",
      },
    ],
  }),
  component: UserDashboard,
});

function UserDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getSessionUser());
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [rushHour, setRushHour] = useState(false);

  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
        store.syncUser(sessionUser);
      }
    }

    setHydrated(true);
  }, [navigate, user]);

  useEffect(() => {
    if (hydrated && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, user, navigate]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoadingFoods(true);
        const res = await fetch(`${BASE}/food`);
        const data = await res.json();

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.foods)
            ? data.foods
            : [];

        setFoods(items.map(normalizeFood));
      } catch (error) {
        toast.error("Failed to load menu");
      } finally {
        setLoadingFoods(false);
      }
    };

    fetchFoods();
  }, []);
  useEffect(() => {
    const fetchRushHour = async () => {
      const res = await fetch(`${BASE}/settings/rush-hour`);
      const data = await res.json();
      setRushHour(data.rushHour);
    };

    fetchRushHour();

    const interval = setInterval(fetchRushHour, 3000);

    return () => clearInterval(interval);
  }, []);

  const userFirstName = user?.fullName?.split(" ")[0] ?? "there";

  const filtered = useMemo(
    () =>
      foods.filter(
        (f) =>
          (cat === "All" || f.category === cat) &&
          f.name.toLowerCase().includes(q.toLowerCase())
      ),
    [foods, cat, q]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* HERO (UNCHANGED) */}
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[oklch(0.55_0.18_30)] p-8 md:p-12 text-primary-foreground mb-8 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -left-8 -bottom-12 h-40 w-40 rounded-full bg-warning/30 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Flame className="h-3.5 w-3.5" /> Fresh today
          </div>

          <h1 className="font-display text-5xl md:text-6xl mt-3">
            Hey {userFirstName},
          </h1>

          <p className="font-display text-3xl md:text-4xl opacity-90">
            what are you eating?
          </p>

          <p className="mt-3 max-w-md text-sm opacity-80">
            Browse the menu, fill your cart, pay, and we'll deliver straight to
            your hostel room.
          </p>
          <div
            className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold ${rushHour === true
                ? "bg-white-500/20 text-green-100"
                : "bg-white-500/20 text-black-100"
              }`}
          >
            {rushHour === true
              ? "Rush Hour is active. You can place orders online."
              : "crowds are currently low. Please visit Dunnkayce physically."}
          </div>
        </div>
      </section>

      {/* FILTERS (UNCHANGED) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex gap-2">
          {["All", "Foods", "Protein"].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${cat === c
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search meals…"
            className="w-full sm:w-64 rounded-full border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {/* FOOD LIST (UNCHANGED UI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loadingFoods && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            Loading menu...
          </div>
        )}

        {filtered.map((f) => {
          const ordered = store.todayOrderedQty(f.id);
          const left = f.dailyLimit - ordered;
          return <FoodCard key={f.id} food={f} left={left} />;
        })}

        {!loadingFoods && filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No meals found.
          </div>
        )}
      </div>
    </main>
  );
}

/* ================= FOOD CARD ================= */

function FoodCard({ food, left }) {
  const [soup, setSoup] = useState("Egusi");

  // ✅ FIXED: proper state safety
  const [quantity, setQuantity] = useState(1);

  const disabled = food.status !== "Available" || left <= 0;

  // ✅ FIXED: correct decrement logic
  const increase = () => setQuantity((p) => p + 1);

  const decrease = () =>
    setQuantity((p) => (p > 1 ? p - 1 : 1));

  const add = async () => {
    if (disabled) {
      return toast.error(
        left <= 0 ? "Daily limit reached" : `Currently ${food.status}`
      );
    }

    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foodId: food.id,
          quantity,
          soup: food.isSwallow ? soup : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Failed to add item");
      }

      toast.success(`${food.name} added (${quantity})`);

      // ✅ IMPORTANT FIX: reset quantity after add
      setQuantity(1);
    } catch (error) {
      toast.error("Network error");
    }
  };

  const statusColor =
    food.status === "Available"
      ? "bg-success/15 text-success"
      : food.status === "Preparing"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-destructive/15 text-destructive";

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={food.imageUrl ?? food.image}
          alt={food.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />

        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}>
          {food.status}
        </span>

        <span className="absolute top-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold">
          {food.category}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1 justify-between">
          <h3 className="font-semibold text-lg">{food.name}</h3>
          <p className="font-semibold text-lg">₦{food.price.toFixed(2)}</p>
        </div>

        {/* QUANTITY CONTROL (UNCHANGED UI STRUCTURE) */}
        <div className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2">
          <button onClick={decrease} className="text-lg font-bold px-2">
            -
          </button>

          <span className="font-semibold">{quantity}</span>

          <button onClick={increase} className="text-lg font-bold px-2">
            +
          </button>
        </div>

        <button
          onClick={add}
          disabled={disabled}
          className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="inline h-4 w-4 mr-1" />
          Add to cart
        </button>
      </div>
    </article>
  );
}