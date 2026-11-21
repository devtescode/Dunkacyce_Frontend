import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock3,
  Drumstick,
  Flame,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Soup,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  queryKeys,
  useAddToCartMutation,
  useFoodsQuery,
  useRushHourQuery,
} from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { store, formatNGN } from "@/lib/store";
import { socket } from "@/lib/socket";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { cn } from "@/lib/utils";

const foodsQueryKey =
  typeof queryKeys.foods.all === "function" ? queryKeys.foods.all() : queryKeys.foods.all;

const CATEGORIES = [
  { id: "All", label: "All", icon: Sparkles },
  { id: "Foods", label: "Foods", icon: UtensilsCrossed },
  { id: "Protein", label: "Protein", icon: Drumstick },
  { id: "Swallow", label: "Swallow", icon: Soup },
];

const PAGE_SIZE = 4;

const normalizeFood = (food) => ({
  ...food,
  id: food?._id ?? food?.id,
  name: food?.name ?? "Meal",
  description: food?.description || "Freshly prepared and delicious.",
  price: Number(food?.price ?? 0),
  image:
    food?.imageUrl ||
    food?.image ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  category: food?.category ?? "Foods",
  status: food?.status ?? "Available",
  isSwallow: Boolean(food?.isSwallow ?? food?.is_swallow),
  availableSoups: Array.isArray(food?.availableSoups)
    ? food.availableSoups
    : Array.isArray(food?.soups)
      ? food.soups
      : [],
  swallowStock: Number(food?.swallowStock ?? food?.swallowQuantity ?? food?.stock ?? 0),
  swallowQuantity: Number(food?.swallowQuantity ?? food?.swallowStock ?? food?.stock ?? 0),
});

export const Route = createFileRoute("/user-dashboard")({
  head: () => ({ meta: [{ title: "Menu — DUNNKAYCE" }] }),
  component: UserDashboard,
});

function UserDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => getSessionUser());
  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const foodsQuery = useFoodsQuery({ refetchInterval: 15000 });
  const rushHourQuery = useRushHourQuery({ refetchInterval: 15000 });
  const foods = useMemo(() => (foodsQuery.data ?? []).map(normalizeFood), [foodsQuery.data]);
  const rushHour = Boolean(rushHourQuery.data);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
      store.syncUser(sessionUser);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/login", replace: true });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    if (!socket) return undefined;
    const onAdd = (food) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev : [];
        const id = food?._id ?? food?.id;
        if (current.some((f) => (f?._id ?? f?.id) === id)) return current;
        return [food, ...current];
      });
    };
    const onUpdate = (food) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev : [];
        const id = food?._id ?? food?.id;
        return current.map((f) => ((f?._id ?? f?.id) === id ? food : f));
      });
    };
    const onDelete = (id) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev : [];
        return current.filter((f) => (f?._id ?? f?.id) !== id);
      });
    };

    socket.on("food_added", onAdd);
    socket.on("food_updated", onUpdate);
    socket.on("food_deleted", onDelete);
    return () => {
      socket.off("food_added", onAdd);
      socket.off("food_updated", onUpdate);
      socket.off("food_deleted", onDelete);
    };
  }, [queryClient]);

  const searchMatchedFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(q) ||
        String(food.description || "").toLowerCase().includes(q),
    );
  }, [foods, search]);

  const categoryCounts = useMemo(() => {
    const counts = { All: searchMatchedFoods.length, Foods: 0, Protein: 0, Swallow: 0 };
    for (const food of searchMatchedFoods) {
      if (food.isSwallow) counts.Swallow += 1;
      if (food.category === "Foods") counts.Foods += 1;
      if (food.category === "Protein") counts.Protein += 1;
    }
    return counts;
  }, [searchMatchedFoods]);

  const filteredFoods = useMemo(() => {
    return searchMatchedFoods.filter((food) => {
      return (
        category === "All" ||
        (category === "Swallow" ? food.isSwallow : food.category === category)
      );
    });
  }, [searchMatchedFoods, category]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedFoods = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFoods.slice(start, start + PAGE_SIZE);
  }, [filteredFoods, page]);

  const pageStart = filteredFoods.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, filteredFoods.length);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <DunnkayceLoader variant="page" label="Loading your menu" caption="Getting fresh meals ready for you." />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground shadow-xl shadow-primary/15 sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-success/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/90">
              <Flame className="h-4 w-4 text-accent" /> Fresh today
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Hey {firstName}, <span className="block text-accent">what are you eating?</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
              Browse the menu, fill your cart, pay securely, and we’ll deliver straight to your hostel room.
            </p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", rushHour ? "bg-accent" : "bg-emerald-300")} />
                <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", rushHour ? "bg-accent" : "bg-emerald-300")} />
              </span>
              <span className="font-medium">
                {rushHour ? "Rush hour is active — place your order online now." : "Crowds are calm — a great time to order."}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90"
            >
              <ShoppingCart className="h-4 w-4" /> Order Online
            </button>
            <button
              onClick={() => navigate({ to: "/orders" })}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-white/15"
            >
              <Clock3 className="h-4 w-4" /> My Orders <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="menu-grid" className="scroll-mt-24 pt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Today's Favourites</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">Explore the menu</h2>
          </div>
          <label className="relative block w-full lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals..."
              aria-label="Search meals"
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const active = category === id;
            const count = categoryCounts[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => setCategory(id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition sm:px-5",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "border-border bg-card text-foreground hover:border-primary/20 hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                <span
                  className={cn(
                    "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
                    active ? "bg-white/20 text-primary-foreground" : "bg-secondary text-primary",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {foodsQuery.isPending && foods.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8">
              <DunnkayceLoader variant="compact" label="Loading today's menu" caption="Fresh picks are on the way." />
            </div>
          ) : foodsQuery.isError ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
              <p className="text-lg font-bold text-foreground">Could not load the menu</p>
              <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
              <button onClick={() => foodsQuery.refetch()} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-bold">No meals match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another category or clear the search.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{pageStart}–{pageEnd}</span> of{" "}
                  <span className="font-semibold text-foreground">{filteredFoods.length}</span>{" "}
                  {filteredFoods.length === 1 ? "meal" : "meals"}
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalPages}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 xl:grid-cols-4">
                {paginatedFoods.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const active = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          aria-label={`Go to page ${pageNum}`}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border border-border bg-card text-foreground hover:bg-secondary",
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function FoodCard({ food }) {
  const { mutateAsync: addToCart, isPending } = useAddToCartMutation();
  const [quantity, setQuantity] = useState(1);
  const [selectedSoup, setSelectedSoup] = useState("");
  const [adding, setAdding] = useState(false);

  const status = String(food.status || "").toLowerCase();
  const swallowStock = Number(food.swallowStock ?? food.swallowQuantity ?? food.stock ?? 0);
  const maxQty = food.isSwallow && swallowStock > 0 ? swallowStock : undefined;
  const unavailable =
    !food.status ||
    ["preparing", "not available", "unavailable", "out of stock", "disabled"].includes(status) ||
    (food.isSwallow && swallowStock <= 0);
  const hasSoups = food.isSwallow && Array.isArray(food.availableSoups) && food.availableSoups.length > 0;
  const canAdd =
    !unavailable &&
    !adding &&
    !isPending &&
    (!hasSoups || Boolean(selectedSoup)) &&
    (!maxQty || quantity <= maxQty);

  useEffect(() => {
    if (maxQty && quantity > maxQty) {
      setQuantity(maxQty);
    }
  }, [maxQty, quantity]);

  const handleAdd = async () => {
    if (hasSoups && !selectedSoup) {
      toast.error("Please select a soup");
      return;
    }
    if (maxQty && quantity > maxQty) {
      toast.error(`Only ${swallowStock} left`);
      return;
    }
    try {
      setAdding(true);
      await addToCart({
        foodId: food.id,
        quantity,
        ...(selectedSoup ? { soup: selectedSoup } : {}),
      });
      toast.success(`${food.name} added to cart`);
      setQuantity(1);
      setSelectedSoup("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/4.6] overflow-hidden bg-muted sm:aspect-[4/4.2]">
        <img
          src={food.image}
          alt={food.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";
          }}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-primary shadow-sm">{food.category}</span>
          {food.isSwallow && <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">Swallow</span>}
        </div>
        <div className="absolute right-3 top-3">
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold shadow-sm", unavailable ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
            {unavailable ? "Unavailable" : "Available"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">{food.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{food.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-black text-primary sm:text-xl">{formatNGN(food.price)}</p>
          {food.isSwallow && food.swallowStock > 0 && <span className="text-[11px] font-medium text-muted-foreground">{food.swallowStock} left</span>}
        </div>

        {hasSoups && (
          <div className="mt-4">
            <label htmlFor={`soup-${food.id}`} className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Soup</span>
              <span className="text-[11px] text-muted-foreground">{food.availableSoups.length} option{food.availableSoups.length === 1 ? "" : "s"}</span>
            </label>
            <select
              id={`soup-${food.id}`}
              value={selectedSoup}
              onChange={(e) => setSelectedSoup(e.target.value)}
              className={cn(
                "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                selectedSoup ? "border-primary/40 text-foreground" : "border-border text-muted-foreground",
              )}
              aria-label={`Select soup for ${food.name}`}
            >
              <option value="">Select a soup...</option>
              {food.availableSoups.map((soup) => (
                <option key={soup} value={soup}>
                  {soup}
                </option>
              ))}
            </select>
            {selectedSoup && (
              <p className="mt-1.5 truncate text-[11px] font-medium text-primary">
                Selected: {selectedSoup}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40" aria-label={`Decrease quantity for ${food.name}`} disabled={unavailable || quantity <= 1}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty ?? Infinity, q + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40" aria-label={`Increase quantity for ${food.name}`} disabled={unavailable || Boolean(maxQty && quantity >= maxQty)}>
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button type="button" onClick={handleAdd} disabled={!canAdd} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart className="h-4 w-4" />
            {adding
              ? "Adding..."
              : unavailable
                ? food.isSwallow && swallowStock <= 0
                  ? "Out of stock"
                  : "Unavailable"
                : hasSoups && !selectedSoup
                  ? "Select a soup"
                  : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}