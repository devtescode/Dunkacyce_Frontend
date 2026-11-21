import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshButton({ onClick, isFetching = false, label = "Refresh", className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      aria-busy={isFetching || undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        className,
      )}
    >
      <RefreshCw
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0",
          isFetching && "animate-[dk-spin_1.1s_linear_infinite] motion-reduce:animate-none",
        )}
      />
      <span>{label}</span>
    </button>
  );
}
