import { AdminNavbar } from "@/components/AdminNavbar";
import { AdminPaymentNotifier } from "@/components/AdminPaymentNotifier";
import { cn } from "@/lib/utils";

export function AdminShell({ title, description, eyebrow, actions, children, className }) {
  const hasHeader = Boolean(title || eyebrow || description || actions);

  return (
    <AdminNavbar>
      <AdminPaymentNotifier />
      <div className={cn("mx-auto w-full max-w-[1600px] space-y-6", className)}>
        {hasHeader ? (
          <header className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                {eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </AdminNavbar>
  );
}
