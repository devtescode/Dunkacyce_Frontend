import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Drumstick,
  Flame,
  Leaf,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Soup,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { getSessionUser } from "@/lib/session";
import {
  ApiError,
  queryKeys,
  useAddToCartMutation,
  useFoodsQuery,
  useRushHourQuery,
} from "@/lib/api";
import { formatNGN } from "@/lib/store";
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

const MENU_PAGE_SIZE = 4;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1400&q=80";

const normalizeFood = (food) => {
  const availableSoups = Array.isArray(food?.availableSoups)
    ? food.availableSoups
    : Array.isArray(food?.soups)
      ? food.soups
      : [];

  return {
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
    availableSoups,
    swallowStock: Number(food?.swallowStock ?? food?.stock ?? 0),
  };
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DUNNKAYCE — Swift Campus Feast" },
      {
        name: "description",
        content:
          "Order your favourite campus meals with ease. Fresh. Tasty. Delivered.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [menuPage, setMenuPage] = useState(1);

  const foodsQuery = useFoodsQuery({ refetchInterval: 15000 });
  const rushHourQuery = useRushHourQuery({ refetchInterval: 15000 });
  const foods = useMemo(() => (foodsQuery.data ?? []).map(normalizeFood), [foodsQuery.data]);
  const rushHour = Boolean(rushHourQuery.data);

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

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesCategory =
        category === "All" ||
        (category === "Swallow" ? food.isSwallow : food.category === category);
      const matchesSearch =
        !q ||
        food.name.toLowerCase().includes(q) ||
        String(food.description || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [foods, category, search]);

  useEffect(() => {
    setMenuPage(1);
  }, [category, search]);

  const menuTotalPages = Math.max(1, Math.ceil(filteredFoods.length / MENU_PAGE_SIZE));

  useEffect(() => {
    setMenuPage((p) => Math.min(p, menuTotalPages));
  }, [menuTotalPages]);

  const paginatedFoods = useMemo(() => {
    const start = (menuPage - 1) * MENU_PAGE_SIZE;
    return filteredFoods.slice(start, start + MENU_PAGE_SIZE);
  }, [filteredFoods, menuPage]);

  const menuPageStart = filteredFoods.length === 0 ? 0 : (menuPage - 1) * MENU_PAGE_SIZE + 1;
  const menuPageEnd = Math.min(menuPage * MENU_PAGE_SIZE, filteredFoods.length);

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-background">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,201,40,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(32,164,71,0.12),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              {/* <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/25 text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </span> */}
              Campus Food, Made Easy
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-primary sm:text-6xl lg:text-7xl">
              Good food.
              <span className="block text-foreground">Zero hassle.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Order your favourite campus meals with ease. Fresh. Tasty. Delivered.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label className="relative block flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for jollof, chicken, swallow..."
                  className="h-14 w-full rounded-2xl border border-border bg-white pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  aria-label="Search food"
                />
              </label>
              <button
                onClick={scrollToMenu}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/92"
              >
                Explore Menu <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-success" /> Freshly prepared</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Secure checkout</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-success" /> Campus delivery</div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-accent/30 blur-2xl" />
            <div className="absolute -bottom-8 -right-4 h-36 w-36 rounded-full bg-success/20 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/60 bg-white p-3 shadow-2xl shadow-primary/10">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                <img
                  src={HERO_IMAGE}
                  alt="Jollof rice, grilled chicken and fried plantain"
                  className="h-[340px] w-full object-cover sm:h-[440px] lg:h-[520px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <div className="absolute right-4 top-4 rounded-2xl border border-white/30 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <span className={cn("relative flex h-2.5 w-2.5", rushHour ? "text-success" : "text-accent")}>
                      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", rushHour ? "bg-success" : "bg-accent")} />
                      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", rushHour ? "bg-success" : "bg-accent")} />
                    </span>
                    Rush Hour
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {rushHour ? "Active — order online now" : "Calm — great time to order"}
                  </p>
                </div>

                <div className="absolute bottom-4 left-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70">Today’s pick</p>
                  <p className="text-lg font-bold">Jollof, Chicken & Plantain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section id="menu" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Today's Favourites</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Fresh meals students love
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Browse delicious campus favourites, pick your quantity, and add them to your cart in seconds.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15"
                      : "border-border bg-white text-foreground hover:border-primary/20 hover:bg-secondary",
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            {foodsQuery.isPending && foods.length === 0 ? (
              <div className="rounded-3xl border border-border bg-white p-8">
                <DunnkayceLoader variant="compact" label="Loading today's favourites" caption="Fetching fresh meals from the kitchen." />
              </div>
            ) : foodsQuery.isError ? (
              <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-lg font-bold text-foreground">Could not load the menu</p>
                <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
                <button
                  onClick={() => foodsQuery.refetch()}
                  className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Retry
                </button>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center">
                <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-bold">No meals found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different category or search term.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {menuPageStart}–{menuPageEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">{filteredFoods.length}</span>{" "}
                    {filteredFoods.length === 1 ? "meal" : "meals"}
                  </p>
                  {menuTotalPages > 1 && (
                    <p className="text-sm text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{menuPage}</span> of{" "}
                      <span className="font-semibold text-foreground">{menuTotalPages}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
                  {paginatedFoods.map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </div>

                {menuTotalPages > 1 && (
                  <nav
                    className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
                    aria-label="Menu pagination"
                  >
                    <button
                      type="button"
                      onClick={() => setMenuPage((p) => Math.max(1, p - 1))}
                      disabled={menuPage === 1}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {Array.from({ length: menuTotalPages }, (_, i) => i + 1).map((pageNum) => {
                        const active = pageNum === menuPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setMenuPage(pageNum)}
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
                      onClick={() => setMenuPage((p) => Math.min(menuTotalPages, p + 1))}
                      disabled={menuPage === menuTotalPages}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / BENEFITS */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/35 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Why DUNNKAYCE</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Built for hungry campus days</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <BenefitCard
              icon={Leaf}
              title="Freshly Prepared"
              description="Always fresh, always tasty."
            />
            <BenefitCard
              icon={ShieldCheck}
              title="Secure Paystack Checkout"
              description="Pay safely and confidently."
            />
            <BenefitCard
              icon={Truck}
              title="Campus Delivery"
              description="Fast and reliable."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/15" />
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function FoodCard({ food }) {
  const navigate = useNavigate();
  const { mutateAsync: addToCart, isPending } = useAddToCartMutation();
  const [quantity, setQuantity] = useState(1);
  const [selectedSoup, setSelectedSoup] = useState("");
  const [adding, setAdding] = useState(false);

  const status = String(food.status || "").toLowerCase();
  const unavailable =
    !food.status ||
    ["preparing", "not available", "unavailable", "out of stock", "disabled"].includes(status);
  const hasSoups = food.isSwallow && Array.isArray(food.availableSoups) && food.availableSoups.length > 0;
  const canAdd = !unavailable && !adding && !isPending && (!hasSoups || selectedSoup);

  const handleAdd = async () => {
    const user = getSessionUser();
    if (!user) {
      toast.error("Please log in to add items to your cart");
      navigate({ to: "/login" });
      return;
    }
    if (hasSoups && !selectedSoup) {
      toast.error("Please select a soup");
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
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/4.6] overflow-hidden bg-muted sm:aspect-[4/4.2]">
        <img
          src={food.image}
          alt={food.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";
          }}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-primary shadow-sm">
            {food.category}
          </span>
          {food.isSwallow && (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
              Swallow
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold shadow-sm",
              unavailable ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
            )}
          >
            {unavailable ? "Unavailable" : "Available"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">{food.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {food.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-black text-primary sm:text-xl">{formatNGN(food.price)}</p>
          {food.isSwallow && food.swallowStock > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground">{food.swallowStock} left</span>
          )}
        </div>

        {hasSoups && (
          <div className="mt-4">
            <label htmlFor={`landing-soup-${food.id}`} className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Soup</span>
              <span className="text-[11px] text-muted-foreground">{food.availableSoups.length} option{food.availableSoups.length === 1 ? "" : "s"}</span>
            </label>
            <select
              id={`landing-soup-${food.id}`}
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
              <p className="mt-1.5 truncate text-[11px] font-medium text-primary">Selected: {selectedSoup}</p>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40"
              aria-label={`Decrease quantity for ${food.name}`}
              disabled={unavailable || quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary disabled:opacity-40"
              aria-label={`Increase quantity for ${food.name}`}
              disabled={unavailable}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {adding ? "Adding..." : unavailable ? "Unavailable" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}