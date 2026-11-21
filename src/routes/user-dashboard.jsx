import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Flame, Search, ShoppingBag, Store } from "lucide-react";
import {
  ApiError,
  queryKeys,
  useAddToCartMutation,
  useFoodsQuery,
  useRushHourQuery,
} from "@/lib/api";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";

// Works whether queryKeys.foods.all is the factory function or the flat key array.
const foodsQueryKey =
  typeof queryKeys.foods.all === "function"
    ? queryKeys.foods.all()
    : queryKeys.foods.all;

/* ================= NORMALIZE ================= */
const normalizeFood = (food) => ({
  ...food,
  id: food._id ?? food.id,
  image: food.imageUrl ?? food.image ?? "",
  category: food.category ?? "Foods",
  isSwallow: Boolean(food?.isSwallow ?? food?.is_swallow ?? false),
});

export const Route = createFileRoute("/user-dashboard")({
  component: UserDashboard,
});

function UserDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(() => getSessionUser());
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const foodsQuery = useFoodsQuery({ refetchInterval: 5000 });
  const rushHourQuery = useRushHourQuery({ refetchInterval: 5000 });

  const foodsData = foodsQuery.data ?? [];
  const foods = useMemo(() => foodsData.map(normalizeFood), [foodsData]);
  const loadingFoods = foodsQuery.isPending;
  const rushHour = rushHourQuery.data ?? false;

  /* ================= AUTH ================= */
  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
      store.syncUser(sessionUser);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, user]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!socket) return;

    const onAdd = (food) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev.map(normalizeFood) : [];
        const exists = current.some((f) => f.id === (food._id || food.id));
        if (exists) return current;

        return [normalizeFood(food), ...current];
      });
    };

    const onUpdate = (updatedFood) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev.map(normalizeFood) : [];
        return current.map((f) =>
          f.id === (updatedFood._id || updatedFood.id)
            ? normalizeFood(updatedFood)
            : f
        );
      });
    };

    const onDelete = (id) => {
      queryClient.setQueryData(foodsQueryKey, (prev = []) => {
        const current = Array.isArray(prev) ? prev.map(normalizeFood) : [];
        return current.filter((f) => f.id !== id && f._id !== id);
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


  /* ================= FILTER ================= */
  const userFirstName = user?.fullName?.split(" ")[0] ?? "there";

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      const matchesCategory =
        cat === "All" ||
        (cat === "Swallow" ? f.isSwallow : f.category === cat);
      return matchesCategory && f.name.toLowerCase().includes(q.toLowerCase());
    });
  }, [foods, cat, q]);

  const OrderHistory = () => { navigate({ to: "/orders" }); }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <DunnkayceLoader variant="page" label="Warming up your dashboard" caption="Getting the campus kitchen ready for you." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

      {/* ================= HERO ================= */}
      {/* <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-black p-5 sm:p-8 text-white mb-6 sm:mb-10">

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Flame className="h-4 w-4 text-yellow-400" />
            Fresh today
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold">
            Hey {userFirstName}
          </h1>
          <p className="font-display text-2xl font-medium tracking-tight text-white/90 md:text-3xl"> what are you eating? </p>

          <p className="mt-3 max-w-md text-sm opacity-80"> Browse the menu, fill your cart, pay, and we'll deliver straight to your hostel room. </p>

          <div className="text-xs sm:text-sm">
            {rushHour ? "Rush Hour is active. You can place orders online" : "crowds are currently low. You can visit Dunnkayce physically."}
          </div>
        </div>
      </section> */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-black p-5 sm:p-8 text-white mb-6 sm:mb-10">

        {/* Glow Orbs */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-accent/25 blur-3xl transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute -left-8 -bottom-12 h-56 w-56 rounded-full bg-warning/20 blur-3xl transition-transform duration-700 group-hover:scale-110" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          {/* LEFT */}
          <div className="space-y-4 max-w-xl">

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase backdrop-blur-md border border-white/10 shadow-sm">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              Fresh today
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-5xl font-black tracking-tight text-white md:text-6xl mt-2">
                Hey {userFirstName},
              </h1>
              <p className="font-display text-2xl font-medium tracking-tight text-white/90 md:text-3xl">
                what are you eating?
              </p>
            </div>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
              Browse the menu, fill your cart, pay seamlessly, and we'll deliver straight to your hostel room.
            </p>

            {/* Status Pill */}
            <div
              className={`mt-4 inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide shadow-inner backdrop-blur-md border transition-all duration-500 ${rushHour
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                : "bg-amber-500/15 text-amber-300 border-amber-500/20"
                }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${rushHour ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${rushHour ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                />
              </span>

              <span className="opacity-90">
                {rushHour
                  ? "Rush Hour is active. You can place orders online."
                  : "Crowds are currently low. You can visit Dunnkayce physically."}
              </span>
            </div>
          </div>

          {/* RIGHT BUTTON */}
          <div className="self-start md:self-auto pt-2 md:pt-0">
            <button
              onClick={() => {
                if (!rushHour) {
                  OrderHistory(); // only navigate in OFF-peak mode
                } else {
                  // DO NOTHING OR OPEN MODAL
                  console.log("Order Online clicked");
                }
              }}
              className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:bg-neutral-50 hover:scale-[1.03] active:scale-[0.98]"
            >
              {rushHour ? (
                <>
                  <ShoppingBag className="h-4 w-4 text-primary transition-transform group-hover:rotate-12" />
                  <span>Order Online Now</span>
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 text-amber-600 transition-transform group-hover:scale-110" />
                  <span>Orders History</span>
                </>
              )}

              <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </section>
      {/* ================= FILTER ================= */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mb-6">

        <div className="flex flex-wrap gap-2">
          {["All", "Foods", "Protein", "Swallow"].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm ${cat === c ? "bg-black text-white" : "bg-gray-200"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="border px-3 py-2 rounded-full w-full sm:w-64"
        />
      </div>

      {/* ================= LIST ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {loadingFoods && foods.length === 0 && (
          <div className="col-span-full text-center">
            <DunnkayceLoader variant="compact" label="Loading today's menu" caption="Fresh picks are on the way." className="w-full justify-center" />
          </div>
        )}

        {filtered.map((f) => (
          <FoodCard key={f.id} food={f} />
        ))}

      </div>
    </main>
  );
}

/* ================= FOOD CARD ================= */
function FoodCard({ food }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: addToCart } = useAddToCartMutation();

  const add = async () => {
    try {
      setLoading(true);

      await addToCart({ foodId: food.id, quantity });

      toast.success(`${food.name} added to cart`);
      setQuantity(1);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Network error"
      );
    } finally {
      setLoading(false);
    }
  };

  const isUnavailable =
    !food.status ||
    ["preparing", "not available", "unavailable", "out of stock"].includes(
      food.status.toLowerCase()
    );

  const statusColor =
    food.status === "Available"
      ? "bg-green-100 text-green-700"
      : food.status === "Not available"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <article className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition">

      {/* IMAGE */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <img src={food.image} className="w-full h-full object-cover" />

        {/* STATUS / SWALLOW */}
        {(food.status || food.isSwallow) && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {food.status && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}
              >
                {food.status}
              </span>
            )}
            {food.isSwallow && (
              <span className="rounded-full border border-amber-200 bg-amber-100/95 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">
                Swallow
              </span>
            )}
          </div>
        )}

        {/* CATEGORY */}
        <span className="absolute top-2 right-2 px-2.5 py-1 text-[11px] rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-sm">
          {food.category}
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-3 sm:p-4 space-y-3">

        {/* NAME + PRICE */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
            {food.name}
          </h3>
          <p className="font-bold text-sm sm:text-base">
            ₦{food.price}
          </p>
        </div>

        {/* QUANTITY */}
        <div className="flex items-center justify-between border rounded-lg px-3 py-2">

          <button
            onClick={() => setQuantity((p) => Math.max(1, p - 1))}
            disabled={isUnavailable}
            className={`text-lg font-bold ${isUnavailable ? "opacity-40 cursor-not-allowed" : ""
              }`}
          >
            -
          </button>

          <span className="font-medium">{quantity}</span>

          <button
            onClick={() => setQuantity((p) => p + 1)}
            disabled={isUnavailable}
            className={`text-lg font-bold ${isUnavailable ? "opacity-40 cursor-not-allowed" : ""
              }`}
          >
            +
          </button>

        </div>

        {/* BUTTON */}
        <button
          onClick={add}
          disabled={loading || isUnavailable}
          className="w-full flex items-center justify-center gap-2 mt-2 text-white py-2.5 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-br from-primary to-black
          "
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Adding...
            </>
          ) : isUnavailable ? (
            "Not Available"
          ) : (
            "Add to Cart"
          )}
        </button>

      </div>
    </article>
  );
}