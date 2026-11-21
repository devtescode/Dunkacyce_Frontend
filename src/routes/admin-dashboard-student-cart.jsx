import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FilterSelect,
  FoodImage,
  LoadingBlock,
  RefreshButton,
  SearchField,
  SectionHeading,
  StatCard,
  StatusPill,
} from "@/components/admin";
import {
  Clock3,
  Mail,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminCartsQuery } from "@/lib/api";
import { getFoodPhoto } from "@/lib/foodImages";
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

function toFiniteNumber(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function StudentCartPage() {
  const { data, error, isPending, isFetching, refetch } = useAdminCartsQuery();
  const loading = isPending;

  const carts = useMemo(() => {
    const source = Array.isArray(data) ? data : [];
    return source.map((cart) => ({
      ...cart,
      items: Array.isArray(cart?.items) ? cart.items : [],
      total: toFiniteNumber(cart?.total),
    }));
  }, [data]);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Summary stats
  const totalStudents = carts.length;
  const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
  const totalValue = carts.reduce((sum, cart) => sum + cart.total, 0);

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = carts.filter((cart) => {
      if (!query) return true;
      const name = String(cart.studentName || "").toLowerCase();
      const email = String(cart.studentEmail || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "total") return b.total - a.total;
      if (sortBy === "items") return b.items.length - a.items.length;
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [carts, search, sortBy]);

  const clearSearch = () => setSearch("");

  return (
    <AdminShell
      eyebrow="Cart monitoring · manual refresh"
      title="Student Carts"
      description="Review active student carts, cart value, and contents. This read-only board updates only when you refresh — no cart is edited here."
      actions={
        <RefreshButton
          onClick={() => refetch()}
          isFetching={isFetching}
          label={isFetching ? "Refreshing..." : "Refresh"}
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Students with items"
            value={totalStudents}
            hint="Carts in the latest snapshot"
            icon={Users}
            tone="forest"
            isLoading={loading}
          />
          <StatCard
            label="Total items in carts"
            value={totalItems}
            hint="Items waiting to be ordered"
            icon={ShoppingBag}
            tone="blue"
            isLoading={loading}
          />
          <StatCard
            label="Total cart value"
            value={formatNGN(totalValue)}
            hint="Potential gross cart value"
            icon={Wallet}
            tone="gold"
            isLoading={loading}
          />
        </div>

        <AdminPanel as="section" className="min-w-0 p-5 sm:p-6">
          <SectionHeading
            eyebrow="Cart workspace"
            title="All student carts"
            description="Search by student name or email, sort by intent, and review each cart's contents at a glance."
            action={
              <StatusPill tone="neutral" dot={false}>
                Read-only
              </StatusPill>
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,190px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,190px)_auto] xl:items-center">
            <SearchField
              id="student-cart-search"
              label="Search student carts"
              placeholder="Search name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <FilterSelect
              id="student-cart-sort"
              label="Sort carts"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              options={SORT_OPTIONS}
            />
            {search ? (
              <ClearSearchButton onClick={clearSearch} className="xl:justify-self-end" />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
              <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              {filteredCarts.length} {filteredCarts.length === 1 ? "cart" : "carts"} shown
            </span>
            {search.trim() ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                Filtered by &quot;{search.trim()}&quot;
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              Manual refresh only
            </span>
          </div>

          <div className="mt-6 min-w-0 space-y-4">
            {error ? (
              <ErrorState
                title="Unable to load student carts"
                description="The cart snapshot could not be fetched. Try again to refresh the board."
                onRetry={() => refetch()}
                retryLabel="Retry"
              />
            ) : loading ? (
              <LoadingBlock
                label="Loading student carts"
                caption="Fetching the latest cart snapshot…"
                rows={2}
                variant="cards"
              />
            ) : carts.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No active student carts"
                description="When students add items to their carts, they will appear here after the next refresh."
                action={
                  <RefreshButton
                    onClick={() => refetch()}
                    isFetching={isFetching}
                    label="Refresh"
                  />
                }
              />
            ) : filteredCarts.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No carts match your search"
                description="Try a different student name or email, or clear the search filter."
                action={<ClearSearchButton onClick={clearSearch} />}
              />
            ) : (
              filteredCarts.map((cart, index) => (
                <StudentCartCard
                  key={cart.userId ?? cart._id ?? cart.id ?? cart.studentEmail ?? index}
                  cart={cart}
                />
              ))
            )}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function StudentCartCard({ cart }) {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemCount = items.length;
  const updatedAt = cart.createdAt ? new Date(cart.createdAt) : null;
  const updatedLabel =
    updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt.toLocaleString() : "Unknown";

  return (
    <AdminPanel as="article" className="min-w-0 p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
            <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {cart.studentName || "Unknown student"}
              </h3>
              <StatusPill tone="forest" dot={false}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </StatusPill>
            </div>
            {cart.studentEmail ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cart.studentEmail}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              Last updated {updatedLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 sm:min-w-[190px] sm:flex-col sm:items-end sm:justify-center sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Cart total
          </p>
          <p className="font-display text-2xl tracking-tight text-primary tabular-nums">
            {formatNGN(cart.total)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const itemName = item?.name || "Food item";
          const itemKey = item?._id ?? item?.id ?? itemName;
          const quantity = toFiniteNumber(item?.quantity);
          const price = toFiniteNumber(item?.price);

          return (
            <AdminPanel
              as="div"
              key={itemKey}
              className="flex min-w-0 items-start gap-3 border-border/60 bg-background/60 p-3 shadow-none"
            >
              <FoodImage
                src={item.imageUrl || getFoodPhoto({ name: itemName, seed: itemKey })}
                alt={itemName}
                seed={itemKey}
                ratio="aspect-[4/3]"
                className="w-20 shrink-0 rounded-xl sm:w-24"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  <span className="text-primary">{quantity}×</span> {itemName}
                </p>
                {item?.soup ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Soup: <span className="font-medium text-foreground/80">{item.soup}</span>
                  </p>
                ) : null}
                <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs tabular-nums">
                  <span className="text-muted-foreground">
                    {quantity} × {formatNGN(price)}
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    =
                  </span>
                  <span className="font-semibold text-primary">
                    {formatNGN(price * quantity)}
                  </span>
                </p>
              </div>
            </AdminPanel>
          );
        })}
      </div>
      {itemCount === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">This cart has no items.</p>
      ) : null}
    </AdminPanel>
  );
}

function ClearSearchButton({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
        className,
      )}
    >
      <X aria-hidden="true" className="h-4 w-4" />
      Clear search
    </button>
  );
}
