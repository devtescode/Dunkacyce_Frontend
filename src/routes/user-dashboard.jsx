import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Search } from "lucide-react";
import { store, useStore, formatNGN } from "@/lib/store";
import { toast } from "sonner";

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

  const user = useStore(
    (s) => (Array.isArray(s.users) ? s.users : []).find((u) => u.id === s.currentUserId) ?? null
  );

  const foods = useStore((s) => (Array.isArray(s.foods) ? s.foods : []));
  const orders = useStore((s) => (Array.isArray(s.orders) ? s.orders : []));

  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // 🔐 AUTH GUARD
  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (!user) {
      const stored = sessionStorage.getItem("user");
      if (stored) {
        try {
          const sessionUser = JSON.parse(stored);
          if (sessionUser?.id) {
            store.syncUser(sessionUser);
          }
        } catch {
          // ignore invalid session data
        }
      }
    }

    setHydrated(true);
  }, [navigate, user]);

  useEffect(() => {
    if (hydrated && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, user, navigate]);

  const userFirstName = user?.fullName?.split(" ")[0] ?? "there";
  const filtered = useMemo(
    () =>
      (foods ?? []).filter(
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

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* HERO */}
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
        </div>
      </section>

      {/* FILTERS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex gap-2">
          {["All", "Foods", "Protein"].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                cat === c
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

      {/* FOOD LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((f) => {
          const ordered = store.todayOrderedQty(f.id);
          const left = f.dailyLimit - ordered;
          return <FoodCard key={f.id} food={f} left={left} />;
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No meals found.
          </div>
        )}
      </div>
    </main>
  );
}

function FoodCard({ food, left }) {
  const [soup, setSoup] = useState("Egusi");

  const disabled = food.status !== "Available" || left <= 0;

  const add = () => {
    if (disabled)
      return toast.error(
        left <= 0 ? "Daily limit reached" : `Currently ${food.status}`
      );

    store.addToCart(food.id, 1, food.isSwallow ? soup : undefined);
    toast.success(`${food.name} added to cart`);
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
          src={food.image}
          alt={food.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />

        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}
        >
          {food.status}
        </span>

        <span className="absolute top-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold">
          {food.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">{food.name}</h3>
        <p className="text-sm text-muted-foreground">{food.description}</p>

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