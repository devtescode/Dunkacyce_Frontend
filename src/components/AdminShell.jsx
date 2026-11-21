import { AdminNavbar } from "@/components/AdminNavbar";
import { AdminPaymentNotifier } from "@/components/AdminPaymentNotifier";
import { cn } from "@/lib/utils";

export function AdminShell({ title, description, eyebrow, actions, children, className }) {
  const hasHeader = Boolean(title || eyebrow || description || actions);

  return (
    <AdminNavbar>
      <AdminPaymentNotifier />
      <div className={cn("mx-auto w-full max-w-[1600px] min-w-0 space-y-6", className)}>
        {hasHeader ? (
          <header className="relative isolate overflow-hidden rounded-3xl border border-forest/10 bg-forest-deep text-white shadow-lg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background-image:radial-gradient(120%_140%_at_100%_0%,rgba(255,255,255,0.16),transparent_55%),linear-gradient(120deg,#062a1c_0%,#0b402b_60%,#0d4a31_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
            />
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:p-7">
              <div className="min-w-0 space-y-2">
                {eyebrow ? (
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
                    <span aria-hidden="true" className="h-px w-5 bg-gold/70" />
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h1 className="font-display text-3xl leading-none tracking-wide text-white sm:text-4xl lg:text-5xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="max-w-3xl text-sm leading-6 text-emerald-50/75 sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-3">{actions}</div>
              ) : null}
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </AdminNavbar>
  );
}
