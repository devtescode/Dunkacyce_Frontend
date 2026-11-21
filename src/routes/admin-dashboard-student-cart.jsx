import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import {
  ArrowUpDown,
  Clock3,
  Mail,
  Package,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminCartsQuery } from "@/lib/api";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-student-cart")({
  component: StudentCartPage,
});

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "total", label: "Highest total" },
  { value: "items", label: "Most items" },
];

function StudentCartPage() {
  const { data, error, isPending, isFetching, refetch } = useAdminCartsQuery();
  const carts = data ?? [];
  const loading = isPending;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    if (error) toast.error("Failed to load student carts");
  }, [error]);

  // Summary stats
  const totalStudents = carts.length;
  const totalItems = carts.reduce((sum, c) => sum + c.items.length, 0);
  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = carts.filter((cart) => {
      if (!query) return true;
      const name = String(cart.studentName || "").toLowerCase();
      const email = String(cart.studentEmail || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "total") return (b.total || 0) - (a.total || 0);
      if (sortBy === "items") return (b.items?.length || 0) - (a.items?.length || 0);
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [carts, search, sortBy]);

  return (
    <AdminShell
      eyebrow="Live Monitoring"
      title="Student Carts"
      description="Monitor active student carts in real time, track cart value, and spot high-intent shoppers before checkout."
      actions={
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Students with items"
            value={totalStudents}
            hint="Active carts right now"
            icon={Users}
            tone="sky"
          />
          <StatCard
            label="Total items in carts"
            value={totalItems}
            hint="Items waiting to be ordered"
            icon={ShoppingBag}
            tone="amber"
          />
          <StatCard
            label="Total cart value"
            value={formatNGN(totalValue)}
            hint="Potential gross cart value"
            icon={Wallet}
            tone="emerald"
          />
        </div>

        <section className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-2xl tracking-tight text-foreground">All student carts</h2>
              <p className="text-sm text-muted-foreground">
                Search by student, sort by intent, and review each cart&apos;s contents at a glance.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_180px]">
              <label className="relative block">
                <span className="sr-only">Search student carts</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  className="h-11 w-full rounded-2xl border border-input bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Sort carts</span>
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 w-full appearance-none rounded-2xl border border-input bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              {filteredCarts.length} {filteredCarts.length === 1 ? "cart" : "carts"} shown
            </span>
            {search.trim() ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                Filtered by &quot;{search.trim()}&quot;
              </span>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <CartSkeletons />
            ) : carts.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No active student carts"
                description="When students add items to their carts, they will appear here for live monitoring."
              />
            ) : filteredCarts.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No carts match your search"
                description="Try a different student name or email, or clear the search filter."
              />
            ) : (
              filteredCarts.map((cart) => <StudentCartCard key={cart.userId} cart={cart} />)
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function StudentCartCard({ cart }) {
  const itemCount = cart.items?.length || 0;
  const updatedAt = cart.createdAt ? new Date(cart.createdAt) : null;
  const updatedLabel =
    updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt.toLocaleString() : "Unknown";

  return (
    <article className="group rounded-3xl border border-border/70 bg-background/70 p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {cart.studentName || "Unknown student"}
              </h3>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            {cart.studentEmail ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cart.studentEmail}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              Last updated {updatedLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 sm:min-w-[180px] sm:flex-col sm:items-end sm:justify-center sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Cart total</p>
          <p className="font-display text-2xl tracking-tight text-primary">{formatNGN(cart.total || 0)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cart.items.map((item) => (
          <div
            key={item._id}
            className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/80 p-3"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold leading-snug text-foreground">
                <span className="text-primary">{item.quantity}×</span> {item.name}
              </p>
              {item.soup ? (
                <p className="text-xs text-muted-foreground">
                  Soup: <span className="font-medium text-foreground/80">{item.soup}</span>
                </p>
              ) : null}
              <p className="text-xs font-medium text-primary">
                {formatNGN((item.price || 0) * (item.quantity || 0))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  const tones = {
    sky: {
      icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      ring: "ring-sky-500/10",
      value: "text-sky-700 dark:text-sky-300",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/10",
      value: "text-amber-700 dark:text-amber-300",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/10",
      value: "text-emerald-700 dark:text-emerald-300",
    },
  };

  const activeTone = tones[tone] || tones.sky;

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn("font-display text-3xl tracking-tight", activeTone.value)}>{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl ring-1", activeTone.icon, activeTone.ring)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 bg-background/50 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function CartSkeletons() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1].map((card) => (
        <div key={card} className="rounded-3xl border border-border/70 bg-background/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-20 w-full animate-pulse rounded-2xl bg-muted sm:w-44" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-border/70 bg-card/80 p-3">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
