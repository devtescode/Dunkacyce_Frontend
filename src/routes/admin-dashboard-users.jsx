import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CircleDollarSign,
  Inbox,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingBlock,
  RefreshButton,
  SearchField,
  StatCard,
  StatusPill,
} from "@/components/admin";
import { AdminShell } from "@/components/AdminShell";
import { useAdminUsersQuery } from "@/lib/api";
import { formatNGN } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-users")({
  head: () => ({ meta: [{ title: "Users — Dunnkayce Admin" }] }),
  component: AdminUsersPage,
});

const GENDER_OPTIONS = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "orders", label: "Most orders" },
  { value: "spend", label: "Highest spend" },
];

function safeText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNumber(value) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return formatNGN(toNumber(value));
}

function formatCount(value) {
  return toNumber(value).toLocaleString("en-NG");
}

function getDisplayName(user) {
  return safeText(user?.fullName).trim() || "Unknown user";
}

function getEmail(user) {
  return safeText(user?.email).trim();
}

function getPhone(user) {
  return safeText(user?.phone).trim();
}

function getInitials(user) {
  const parts = getDisplayName(user).split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  const source = parts[0] || getEmail(user) || "?";
  return source.slice(0, 2).toUpperCase() || "?";
}

function normalizeGender(value) {
  const gender = safeText(value).trim().toLowerCase();
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "other";
}

function getGenderLabel(value) {
  const gender = normalizeGender(value);
  if (gender === "male") return "Male";
  if (gender === "female") return "Female";
  return "Not set";
}

function getTimestamp(user) {
  const raw = user?.createdAt;
  if (raw === null || raw === undefined || raw === "") return 0;
  try {
    const date = raw instanceof Date ? raw : new Date(raw);
    const time = date.getTime();
    return Number.isFinite(time) ? time : 0;
  } catch {
    return 0;
  }
}

function formatDate(value) {
  if (value === null || value === undefined || value === "") return "—";
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

function getUserKey(user, index) {
  const id = safeText(user?._id).trim();
  if (id) return id;
  const email = getEmail(user);
  if (email) return `email:${email}`;
  return `user-${index}`;
}

function AdminUsersPage() {
  const { data, error, isPending, isFetching, refetch } = useAdminUsersQuery();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const users = useMemo(
    () =>
      Array.isArray(data)
        ? data.filter((user) => user && typeof user === "object" && !Array.isArray(user))
        : [],
    [data],
  );

  const loading = isPending;

  useEffect(() => {
    if (error) {
      const message =
        error?.message && typeof error.message === "string"
          ? `Failed to load registered users: ${error.message}`
          : "Failed to load registered users";
      toast.error(message);
    }
  }, [error]);

  const stats = useMemo(() => {
    let paidCustomers = 0;
    let totalPaid = 0;

    users.forEach((user) => {
      if (toNumber(user?.orderCount) > 0) paidCustomers += 1;
      totalPaid += toNumber(user?.totalPaid);
    });

    return {
      totalUsers: users.length,
      paidCustomers,
      totalPaid,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

    const list = users.filter((user) => {
      if (genderFilter !== "all" && normalizeGender(user?.gender) !== genderFilter) return false;
      if (!query) return true;

      return [getDisplayName(user), getEmail(user), getPhone(user)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });

    return [...list].sort((a, b) => {
      const aTime = getTimestamp(a);
      const bTime = getTimestamp(b);
      const aOrders = toNumber(a?.orderCount);
      const bOrders = toNumber(b?.orderCount);
      const aPaid = toNumber(a?.totalPaid);
      const bPaid = toNumber(b?.totalPaid);
      const aName = getDisplayName(a);
      const bName = getDisplayName(b);

      switch (sortBy) {
        case "oldest":
          return aTime - bTime || collator.compare(aName, bName);
        case "name":
          return collator.compare(aName, bName) || bTime - aTime;
        case "orders":
          return bOrders - aOrders || bPaid - aPaid || collator.compare(aName, bName);
        case "spend":
          return bPaid - aPaid || bOrders - aOrders || collator.compare(aName, bName);
        case "newest":
        default:
          return bTime - aTime || collator.compare(aName, bName);
      }
    });
  }, [users, search, genderFilter, sortBy]);

  const hasActiveFilters =
    Boolean(search.trim()) || genderFilter !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setGenderFilter("all");
    setSortBy("newest");
  };

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <AdminShell
      eyebrow="Admin Command Center"
      title="Registered Users"
      description="The campus user directory for every registered Dunnkayce account. User data is sensitive: keep contact details within authorized admin use and never share them outside official operations."
      actions={
        <RefreshButton
          onClick={handleRefresh}
          isFetching={isFetching}
          label={isFetching ? "Refreshing..." : "Refresh"}
          className="rounded-full px-4"
        />
      }
    >
      <div className="min-w-0 space-y-6">
        <section
          aria-label="Registered user statistics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <StatCard
            icon={Users}
            label="Total users"
            value={formatCount(stats.totalUsers)}
            hint="Registered campus accounts"
            tone="forest"
            isLoading={loading}
          />
          <StatCard
            icon={UserRoundCheck}
            label="Paid customers"
            value={formatCount(stats.paidCustomers)}
            hint="Users with at least one order"
            tone="fresh"
            isLoading={loading}
          />
          <StatCard
            icon={CircleDollarSign}
            label="Total paid"
            value={formatMoney(stats.totalPaid)}
            hint="Lifetime payments across users"
            tone="gold"
            isLoading={loading}
          />
        </section>

        <AdminPanel as="section" aria-label="Registered users directory" className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <StatusPill tone="gold" dot={false} className="gap-1.5">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                Sensitive admin data
              </StatusPill>
              <div className="space-y-1">
                <h2 className="font-display text-2xl tracking-tight text-foreground">
                  All users
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Search by name, email, or phone; filter by gender; and sort by signup date,
                  orders, or spend.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_minmax(0,170px)_minmax(0,200px)]">
              <div className="space-y-1.5">
                <label
                  htmlFor="user-search"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Search users
                </label>
                <div className="relative">
                  <SearchField
                    id="user-search"
                    label="Search users"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, or phone"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="gender-filter"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Gender
                </label>
                <FilterSelect
                  id="gender-filter"
                  label="Filter users by gender"
                  value={genderFilter}
                  onChange={(event) => setGenderFilter(event.target.value)}
                  options={GENDER_OPTIONS}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="user-sort"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Sort by
                </label>
                <FilterSelect
                  id="user-sort"
                  label="Sort users"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  options={SORT_OPTIONS}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                <span aria-live="polite" aria-atomic="true">
                  Showing{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {loading ? "—" : filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {users.length}
                  </span>{" "}
                  users
                </span>
              </span>
              {search.trim() ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                  Filtered by &quot;{search.trim()}&quot;
                </span>
              ) : null}
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="mt-6 min-w-0">
            {loading ? (
              <div className="space-y-3">
                <LoadingBlock
                  label="Loading registered users"
                  caption="Fetching the campus directory…"
                  rows={6}
                  variant="table"
                  className="hidden md:block"
                />
                <LoadingBlock
                  label="Loading registered users"
                  caption="Fetching the campus directory…"
                  rows={4}
                  variant="rows"
                  className="md:hidden"
                />
              </div>
            ) : error ? (
              <ErrorState
                title="Couldn't load users"
                description={
                  error?.message && typeof error.message === "string"
                    ? error.message
                    : "The user directory is temporarily unavailable. Check your connection and try again."
                }
                onRetry={handleRefresh}
                retryLabel={isFetching ? "Retrying..." : "Retry"}
              />
            ) : users.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No users yet"
                description="Registered campus accounts will appear here as soon as students sign up."
                action={
                  <RefreshButton
                    onClick={handleRefresh}
                    isFetching={isFetching}
                    label="Refresh"
                  />
                }
              />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching users"
                description="No accounts match the current search and filters. Try another name, email, or phone number."
                action={
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-primary/25 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <UsersTable users={filteredUsers} sortBy={sortBy} />
                <div className="space-y-3 md:hidden">
                  {filteredUsers.map((user, index) => (
                    <UserMobileCard key={getUserKey(user, index)} user={user} />
                  ))}
                </div>
              </>
            )}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function UserAvatar({ user, className }) {
  const [failed, setFailed] = useState(false);
  const src = safeText(user?.profilePicture).trim();

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-primary/10 text-xs font-semibold text-primary",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(user)}</span>
      )}
    </div>
  );
}

function GenderBadge({ value }) {
  const gender = normalizeGender(value);
  const tone = gender === "male" ? "blue" : gender === "female" ? "violet" : "neutral";

  return <StatusPill tone={tone}>{getGenderLabel(value)}</StatusPill>;
}

function UsersTable({ users, sortBy }) {
  return (
    <div className="hidden max-h-[70vh] overflow-auto rounded-2xl border border-border/70 bg-background/60 md:block">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <caption className="sr-only">Registered users directory</caption>
        <thead className="sticky top-0 z-10 bg-muted/90 text-[11px] uppercase tracking-[0.16em] text-muted-foreground shadow-[0_1px_0_0_var(--color-border)] backdrop-blur-sm">
          <tr>
            <th
              scope="col"
              aria-sort={sortBy === "name" ? "ascending" : "none"}
              className="px-5 py-4 font-semibold"
            >
              User
            </th>
            <th scope="col" className="px-4 py-4 font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                Phone
              </span>
            </th>
            <th scope="col" className="px-4 py-4 font-semibold">
              Gender
            </th>
            <th
              scope="col"
              aria-sort={sortBy === "orders" ? "descending" : "none"}
              className="px-4 py-4 font-semibold"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag aria-hidden="true" className="h-3.5 w-3.5" />
                Orders
              </span>
            </th>
            <th
              scope="col"
              aria-sort={sortBy === "spend" ? "descending" : "none"}
              className="px-4 py-4 font-semibold"
            >
              Total paid
            </th>
            <th
              scope="col"
              aria-sort={
                sortBy === "newest" ? "descending" : sortBy === "oldest" ? "ascending" : "none"
              }
              className="px-5 py-4 font-semibold"
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                Joined
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={getUserKey(user, index)}
              className="border-t border-border/60 transition-colors hover:bg-primary/[0.03] motion-reduce:transition-none"
            >
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar user={user} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {getDisplayName(user)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{getEmail(user) || "—"}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 tabular-nums text-muted-foreground">
                {getPhone(user) || "—"}
              </td>
              <td className="px-4 py-4">
                <GenderBadge value={user?.gender} />
              </td>
              <td className="px-4 py-4 font-medium tabular-nums text-foreground">
                {formatCount(user?.orderCount)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-success">
                {formatMoney(user?.totalPaid)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums text-muted-foreground">
                {formatDate(user?.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserMobileCard({ user }) {
  return (
    <AdminPanel
      as="article"
      className="p-4 transition-colors hover:border-primary/30 motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={user} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {getDisplayName(user)}
            </h3>
            <GenderBadge value={user?.gender} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getEmail(user) || "—"}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getPhone(user) || "—"}</span>
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm sm:gap-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Orders
          </dt>
          <dd className="mt-1 font-semibold tabular-nums text-foreground">
            {formatCount(user?.orderCount)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total paid
          </dt>
          <dd className="mt-1 break-words text-[13px] font-semibold leading-tight tabular-nums text-success sm:text-sm">
            {formatMoney(user?.totalPaid)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Joined
          </dt>
          <dd className="mt-1 whitespace-nowrap text-[13px] font-medium tabular-nums text-foreground sm:text-sm">
            {formatDate(user?.createdAt)}
          </dd>
        </div>
      </dl>
    </AdminPanel>
  );
}
