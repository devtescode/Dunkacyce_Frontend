import { cn } from "@/lib/utils";

const bar = "animate-pulse rounded-md bg-muted motion-reduce:animate-none";

export function LoadingBlock({
  label = "Loading…",
  caption,
  rows = 3,
  variant = "cards",
  className,
}) {
  const count = Math.max(1, Math.min(Number(rows) || 3, 12));
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("w-full min-w-0", className)}
    >
      <span className="sr-only">{label}</span>

      {variant === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
          <div className="grid grid-cols-3 gap-4 border-b border-border/70 bg-muted/50 p-4">
            <div className={cn(bar, "h-3 w-20")} />
            <div className={cn(bar, "h-3 w-24")} />
            <div className={cn(bar, "h-3 w-16")} />
          </div>
          {items.map((item) => (
            <div
              key={item}
              className="grid grid-cols-3 gap-4 border-b border-border/70 p-4 last:border-b-0"
            >
              <div className={cn(bar, "h-4 w-4/5")} />
              <div className={cn(bar, "h-4 w-2/3")} />
              <div className={cn(bar, "h-4 w-14")} />
            </div>
          ))}
        </div>
      ) : variant === "rows" ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card/70 p-4"
            >
              <div className={cn(bar, "h-11 w-11 shrink-0 rounded-xl")} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className={cn(bar, "h-3.5 w-2/5")} />
                <div className={cn(bar, "h-3 w-3/5")} />
              </div>
              <div className={cn(bar, "hidden h-7 w-20 rounded-full sm:block")} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item}
              className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-5"
            >
              <div className={cn(bar, "aspect-[4/3] w-full rounded-xl")} />
              <div className={cn(bar, "h-4 w-3/4")} />
              <div className={cn(bar, "h-3 w-1/2")} />
            </div>
          ))}
        </div>
      )}

      {caption ? <p className="mt-3 text-center text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
