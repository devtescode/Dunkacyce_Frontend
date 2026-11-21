import { cn } from "@/lib/utils";
import { AdminPanel } from "./AdminPanel";
import { resolveTone } from "./toneClasses";

const skeletonBar = "animate-pulse rounded-md bg-muted motion-reduce:animate-none";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "forest",
  isLoading = false,
  className,
}) {
  const colors = resolveTone(tone);

  return (
    <AdminPanel className={cn("p-4 sm:p-5", className)}>
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={`Loading ${label}`}
          className="flex items-start justify-between gap-3"
        >
          <span className="sr-only">Loading {label}</span>
          <div className="w-full space-y-3">
            <div className={cn(skeletonBar, "h-3 w-24")} />
            <div className={cn(skeletonBar, "h-8 w-20")} />
            <div className={cn(skeletonBar, "h-3 w-28")} />
          </div>
          <div className={cn(skeletonBar, "h-11 w-11 shrink-0 rounded-xl")} />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <div className="font-display text-3xl leading-none tabular-nums text-foreground sm:text-4xl">
              {value}
            </div>
            {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
          </div>
          {Icon ? (
            <span
              className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", colors.icon)}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </span>
          ) : null}
        </div>
      )}
    </AdminPanel>
  );
}
