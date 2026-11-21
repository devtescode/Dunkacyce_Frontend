import { cn } from "@/lib/utils";
import { PreviewBadge } from "./PreviewBadge";

export function PreviewBanner({ title, description, statusRows = [], children, className }) {
  const rows = Array.isArray(statusRows) ? statusRows : [];

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-dashed border-gold/50 bg-gradient-to-br from-warning/15 via-card to-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 border-t-2 border-dashed border-gold/70"
      />
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-warning/15 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <PreviewBadge />
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>

      {rows.length ? (
        <dl className="relative mt-5 grid gap-3 border-t border-dashed border-gold/40 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="rounded-xl border border-border/70 bg-card/80 px-4 py-3"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
