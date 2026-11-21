import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  CreditCard,
  FileSearch,
  Landmark,
  ReceiptText,
  RefreshCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-payment-tracking")({
  head: () => ({ meta: [{ title: "Payment Tracking — Dunnkayce Admin" }] }),
  component: PaymentTrackingPage,
});

const plannedCapabilities = [
  {
    title: "Live payment monitoring",
    description:
      "Track incoming payments in real time, spot delays quickly, and understand payment flow across the platform.",
    icon: Wallet,
  },
  {
    title: "Manual verification",
    description:
      "Review transfer evidence, confirm legitimate payments, and resolve edge cases with a clear audit trail.",
    icon: BadgeCheck,
  },
  {
    title: "Reference lookup",
    description:
      "Search by transaction reference, student, or order to find the exact payment record you need in seconds.",
    icon: ScanSearch,
  },
  {
    title: "Reconciliation",
    description:
      "Match gateway records with internal orders, flag mismatches, and close daily finance checks with confidence.",
    icon: RefreshCcw,
  },
];

const sampleStats = [
  {
    label: "Payments in review",
    value: "12",
    note: "Sample queue size",
    icon: Clock3,
  },
  {
    label: "Verification rate",
    value: "96%",
    note: "Sample performance",
    icon: ShieldCheck,
  },
  {
    label: "Reference lookups",
    value: "38",
    note: "Sample daily activity",
    icon: FileSearch,
  },
];

const sampleQueue = [
  {
    student: "Sample Student A",
    reference: "REF-SAMPLE-1042",
    amount: "₦2,400",
    status: "Awaiting review",
    statusClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    student: "Sample Student B",
    reference: "REF-SAMPLE-1043",
    amount: "₦1,800",
    status: "Verified",
    statusClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    student: "Sample Student C",
    reference: "REF-SAMPLE-1044",
    amount: "₦3,200",
    status: "Needs reference",
    statusClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
];

function PaymentTrackingPage() {
  return (
    <AdminShell
      eyebrow="Finance operations"
      title="Payment Tracking"
      description="A premium workspace for monitoring payments, verifying manual transfers, and reconciling records when live finance integrations are connected."
      actions={
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </div>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                <ReceiptText className="h-3.5 w-3.5" />
                Preview · Sample data only
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  Finance visibility, built for confidence.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This page previews the upcoming payment operations experience. The figures and records below
                  are illustrative sample data for design review and are not connected to live payment activity.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[22rem]">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">In design preview</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  No live payment data or API connections yet.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Planned focus
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">Verification & reconciliation</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Built for clear, auditable finance workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="sample-overview-heading" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                Sample overview
              </p>
              <h3 id="sample-overview-heading" className="mt-1 text-xl font-semibold text-foreground">
                Preview metrics
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Illustrative values only — not real payment data.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {sampleStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article
                  key={stat.label}
                  className="group rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-dashed border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Sample
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{stat.note}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section
            aria-labelledby="capabilities-heading"
            className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                Planned capabilities
              </p>
              <h3 id="capabilities-heading" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Everything finance teams will need in one place
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The payment tracking module is being designed to make campus payment operations transparent,
                fast, and easy to audit.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {plannedCapabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <article
                    key={capability.title}
                    className="rounded-3xl border border-border/70 bg-background/70 p-5 transition hover:border-primary/20 hover:bg-background"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-semibold text-foreground">{capability.title}</h4>
                        <p className="text-sm leading-6 text-muted-foreground">{capability.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="sample-queue-heading"
            className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Preview interface
                </p>
                <h3 id="sample-queue-heading" className="mt-2 text-xl font-semibold text-foreground">
                  Sample verification queue
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A design preview of how manual payment reviews may appear.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-dashed border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Sample data
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {sampleQueue.map((item) => (
                <article
                  key={item.reference}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.student}</p>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Sample
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reference: <span className="font-medium text-foreground/80">{item.reference}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                        {item.amount}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${item.statusClass}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Landmark className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Designed for real finance workflows</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    When enabled, this area will support payment record review, reference validation, and
                    reconciliation actions with live operational data.
                  </p>
                </div>
                <ArrowUpRight className="ml-auto hidden h-4 w-4 shrink-0 text-primary/70 sm:block" />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-dashed border-border/80 bg-muted/20 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm ring-1 ring-border/60">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Preview disclaimer</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  All payment amounts, statuses, references, and activity shown on this page are sample UI
                  content for preview purposes only. They do not represent real transactions, students, or
                  financial records.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              No live data connected
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
