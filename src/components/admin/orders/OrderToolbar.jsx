import { useId } from "react";
import { Eye, EyeOff, Search, SlidersHorizontal, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Preparing", label: "Preparing" },
  { value: "Ready", label: "Ready" },
  { value: "Delivered", label: "Delivered" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high to low" },
  { value: "total-asc", label: "Total: low to high" },
  { value: "late-first", label: "Late first" },
];

function toCount(value) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function invoke(callback, ...args) {
  if (typeof callback === "function") callback(...args);
}

export function OrderToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  statusCounts,
  total,
  shown,
  onClear,
  showPii,
  onTogglePii,
  connected = true,
}) {
  const searchId = useId();
  const sortId = useId();

  const safeSearch = search ?? "";
  const safeStatusFilter = statusFilter ?? "all";
  const safeSortBy = sortBy ?? "newest";
  const safeShowPii = Boolean(showPii);
  const safeConnected = Boolean(connected);
  const safeTotal = toCount(total);
  const safeShown = toCount(shown);

  return (
    <section aria-label="Order directory controls" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl tracking-tight text-foreground">Order directory</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              Showing <span className="font-semibold text-foreground">{safeShown}</span> of{" "}
              <span className="font-semibold text-foreground">{safeTotal}</span> paid orders
            </span>
          </span>
        </div>

        {/* <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => invoke(onClear)}
          className="self-start rounded-full text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden="true" />
          Clear
        </Button> */}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter orders by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {STATUS_TABS.map((tab) => {
            const isActive = safeStatusFilter === tab.value;
            const count = toCount(statusCounts?.[tab.value]);

            return (
              <Button
                key={tab.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "ghost"}
                aria-pressed={isActive}
                onClick={() => invoke(onStatusFilterChange, tab.value)}
                className={cn(
                  "gap-2 rounded-full px-3",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:min-w-64 xl:min-w-72">
            <label htmlFor={searchId} className="sr-only">
              Search orders
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={searchId}
              type="search"
              value={safeSearch}
              onChange={(event) => invoke(onSearchChange, event.target.value)}
              placeholder="Search orders"
              aria-label="Search orders"
              className="pl-9 pr-10"
            />
            {safeSearch ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => invoke(onSearchChange, "")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="sm:w-44">
            <label htmlFor={sortId} className="sr-only">
              Sort orders
            </label>
            <Select value={safeSortBy} onValueChange={(value) => invoke(onSortByChange, value)}>
              <SelectTrigger id={sortId} aria-label="Sort orders">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={safeShowPii}
            onClick={() => invoke(onTogglePii, !safeShowPii)}
            className="rounded-full"
          >
            {safeShowPii ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {safeShowPii ? "Hide PII" : "Show PII"}
          </Button>

          {/* <span
            role="status"
            aria-live="polite"
            className={cn(
              "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs font-medium",
              safeConnected
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {safeConnected ? (
              <Wifi aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : (
              <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            {safeConnected ? "Live" : "Offline"}
          </span> */}
        </div>
      </div>
    </section>
  );
}

export default OrderToolbar;
