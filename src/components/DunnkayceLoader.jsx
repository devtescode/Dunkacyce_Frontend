import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function DunnkayceLoader({
  variant = "page",
  label = "Loading your orders...",
  caption,
  className,
  icon: Icon = UtensilsCrossed,
}) {
  const isCompact = variant === "compact";

  const rootProps = {
    role: "status",
    "aria-live": "polite",
    "aria-busy": "true",
  };

  if (isCompact) {
    return (
      <div
        {...rootProps}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3",
          className
        )}
      >
        <span className="sr-only">{label}</span>

        <span
          aria-hidden="true"
          className="relative h-5 w-5 shrink-0"
        >
          <span className="absolute inset-0 rounded-full border-2 border-orange-100 border-t-orange-500 animate-[dk-spin_1.1s_linear_infinite] motion-reduce:animate-none" />
        </span>

        <Icon
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-orange-500"
          strokeWidth={1.8}
        />

        <span className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {caption ? (
            <span className="text-xs text-muted-foreground">{caption}</span>
          ) : null}
        </span>

        <span aria-hidden="true" className="ml-1 flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-[dk-pulse-soft_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 0.18}s` }}
            />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div
      {...rootProps}
      className={cn(
        "relative isolate flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-6 py-16 text-center",
        className
      )}
    >
      <span className="sr-only">{label}</span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -z-10 left-1/4 top-1/4 h-64 w-64 rounded-full bg-orange-200/60 blur-3xl" />
        <div className="absolute -z-10 bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-11 -top-7 text-2xl animate-[dk-float_2.4s_ease-in-out_infinite] [animation-delay:0s] motion-reduce:animate-none"
        >
          🍛
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-4 text-2xl animate-[dk-float_2.4s_ease-in-out_infinite] [animation-delay:0.4s] motion-reduce:animate-none"
        >
          🍜
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-xl animate-[dk-float_2.4s_ease-in-out_infinite] [animation-delay:0.8s] motion-reduce:animate-none"
        >
          ✨
        </div>

        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-orange-100 bg-white shadow-lg">
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full border-4 border-orange-100 border-t-orange-500 animate-[dk-spin_1.1s_linear_infinite] motion-reduce:animate-none"
          />
          <Icon
            aria-hidden="true"
            className="relative h-10 w-10 text-orange-500"
            strokeWidth={1.8}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-orange-500">
          DUNNKAYCE
        </p>
        <h2 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">
          {label}
        </h2>
        {caption ? (
          <p className="text-sm text-muted-foreground">{caption}</p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="h-1.5 w-56 overflow-hidden rounded-full bg-orange-100"
      >
        <div className="h-full w-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 animate-[dk-shimmer_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default DunnkayceLoader;
