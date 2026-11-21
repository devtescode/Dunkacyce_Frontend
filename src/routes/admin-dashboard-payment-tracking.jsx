import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  PreviewBadge,
  PreviewBanner,
  SectionHeading,
  StatCard,
  StatusPill,
} from "@/components/admin";
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
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-payment-tracking")({
  head: () => ({
    meta: [
      { title: "Payment Tracking — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentTrackingPage,
});

const plannedCapabilities = [
  {
    title: "Live payment monitoring",
    description:
      "Track incoming payments, spot delays quickly, and understand payment flow across the platform.",
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

// Presentation-only tone mapping for the sample rows; no sample values are changed.
const sampleStatusTones = {
  "Awaiting review": "gold",
  Verified: "fresh",
  "Needs reference": "blue",
};

function PaymentTrackingPage() {
  return (
    <AdminShell
      eyebrow="Finance operations"
      title="Payment Tracking"
      description="A premium workspace for monitoring payments, verifying manual transfers, and reconciling records when live finance integrations are connected."
      actions={
        <PreviewBadge label="Coming soon" />
      }
    >
      <div className="space-y-6">
        <PreviewBanner
          title="Finance visibility, built for confidence."
          description="This page previews the upcoming payment operations experience. The figures and records below are illustrative sample data for design review and are not connected to live payment activity."
          statusRows={[
            {
              label: "Status",
              value: (
                <span className="block">
                  In design preview
                  <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                    No live payment data or API connections yet.
                  </span>
                </span>
              ),
            },
            {
              label: "Planned focus",
              value: (
                <span className="block">
                  Verification & reconciliation
                  <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                    Built for clear, auditable finance workflows.
                  </span>
                </span>
              ),
            },
            {
              label: "Data connection",
              value: <StatusPill tone="gold">No live data connected</StatusPill>,
            },
          ]}
        >
          <PreviewBadge label="Preview · Sample data only" />
        </PreviewBanner>

        <section aria-labelledby="sample-overview-heading" className="space-y-4">
          <div id="sample-overview-heading">
            <SectionHeading
              eyebrow="Sample overview"
              title="Preview metrics"
              description="Illustrative values only — not real payment data."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {sampleStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                tone="forest"
                hint={
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="gold" dot={false}>
                      Sample
                    </StatusPill>
                    <span>{stat.note}</span>
                  </span>
                }
              />
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminPanel as="section" aria-labelledby="capabilities-heading" className="p-6 sm:p-7">
            <div id="capabilities-heading">
              <SectionHeading
                eyebrow="Planned capabilities"
                title="Everything finance teams will need in one place"
                description="The payment tracking module is being designed to make campus payment operations transparent, fast, and easy to audit."
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {plannedCapabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <AdminPanel
                    as="div"
                    key={capability.title}
                    className="border-border/60 bg-background/60 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-foreground">{capability.title}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {capability.description}
                        </p>
                      </div>
                    </div>
                  </AdminPanel>
                );
              })}
            </div>

            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Planned only — none of these capabilities are active in this preview.
            </p>
          </AdminPanel>

          <AdminPanel as="section" aria-labelledby="sample-queue-heading" className="p-6 sm:p-7">
            <div id="sample-queue-heading">
              <SectionHeading
                eyebrow="Preview interface"
                title="Sample verification queue"
                description="A design preview of how manual payment reviews may appear."
                action={
                  <StatusPill tone="gold" dot={false}>
                    Sample data
                  </StatusPill>
                }
              />
            </div>

            <div className="mt-6 space-y-3">
              {sampleQueue.map((item) => (
                <AdminPanel
                  as="div"
                  key={item.reference}
                  className="border-border/60 bg-background/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.student}</p>
                        <StatusPill tone="gold" dot={false}>
                          Sample
                        </StatusPill>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reference: <span className="font-medium text-foreground/80">{item.reference}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
                        {item.amount}
                      </span>
                      <StatusPill tone={sampleStatusTones[item.status] ?? "neutral"}>
                        {item.status}
                      </StatusPill>
                    </div>
                  </div>
                </AdminPanel>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.06] p-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                >
                  <Landmark className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Designed for real finance workflows</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    When enabled, this area will support payment record review, reference validation, and
                    reconciliation actions with live operational data.
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="ml-auto hidden h-4 w-4 shrink-0 text-primary/70 sm:block"
                />
              </div>
            </div>
          </AdminPanel>
        </div>

        <AdminPanel
          as="section"
          className="border-dashed border-gold/50 bg-warning/[0.06] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border/60"
              >
                <CreditCard className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  <ReceiptText aria-hidden="true" className="mr-1.5 inline-block h-4 w-4 align-[-2px] text-primary" />
                  Preview disclaimer
                </h3>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  All payment amounts, statuses, references, and activity shown on this page are sample UI
                  content for preview purposes only. They do not represent real transactions, students, or
                  financial records.
                </p>
                <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
                  Every figure on this page is illustrative and was not fetched from a live service. Do not
                  use these values for reporting, reconciliation, or auditing.
                </p>
              </div>
            </div>
            <StatusPill tone="gold" dot={false} className="shrink-0">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              No live data connected
            </StatusPill>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
