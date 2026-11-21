import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <h3 className="font-display text-xl uppercase tracking-wide text-foreground sm:text-2xl">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-card px-4 py-2.5 text-sm font-semibold text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
