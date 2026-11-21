import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock3,
  LineChart,
  Repeat2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-user-analytics")({
  head: () => ({ meta: [{ title: "User Analytics — Dunnkayce Admin" }] }),
  component: UserAnalyticsPage,
});

const plannedCapabilities = [
  {
    title: "Registered users",
    description:
      "Track total student signups, growth over time, and onboarding momentum across campus.",
    icon: Users,
  },
  {
    title: "Active users",
    description:
      "See who is actively ordering, browsing, or returning so you can measure real engagement.",
    icon: Activity,
  },
  {
    title: "Trends",
    description:
      "Spot demand patterns by day, week, and meal window to guide menu and staffing decisions.",
    icon: TrendingUp,
  },
  {
    title: "Repeat orders",
    description:
      "Understand loyalty with repeat purchase rates, retention signals, and customer frequency.",
    icon: Repeat2,
  },
  {
    title: "Session insights",
    description:
      "Learn how long students spend in the app and where they engage most before placing orders.",
    icon: Clock3,
  },
];

const sampleMetrics = [
  {
    label: "Registered users",
    value: "1,284",
    change: "+8.2% sample growth",
    icon: Users,
    note: "Illustrative total student accounts",
  },
  {
    label: "Active users",
    value: "462",
    change: "+5.1% sample activity",
    icon: Activity,
    note: "Illustrative daily active students",
  },
  {
    label: "Repeat orders",
    value: "64%",
    change: "+2.4 pts sample lift",
    icon: Repeat2,
    note: "Illustrative returning customer rate",
  },
  {
    label: "Avg. session",
    value: "18m 24s",
    change: "Stable sample range",
    icon: Clock3,
    note: "Illustrative session duration",
  },
];

const sampleTrend = [
  { day: "Mon", value: 38 },
  { day: "Tue", value: 52 },
  { day: "Wed", value: 47 },
  { day: "Thu", value: 63 },
  { day: "Fri", value: 78 },
  { day: "Sat", value: 71 },
  { day: "Sun", value: 56 },
];

const sampleHighlights = [
  {
    title: "Peak ordering window",
    value: "6:00 PM - 8:00 PM",
    detail: "Sample insight showing when demand may concentrate.",
  },
  {
    title: "Most engaged segment",
    value: "Returning students",
    detail: "Sample insight for repeat-order behavior and loyalty.",
  },
  {
    title: "Growth signal",
    value: "Week-over-week lift",
    detail: "Sample trend indicator for registrations and activity.",
  },
];

function UserAnalyticsPage() {
  return (
    <AdminShell
      eyebrow="Insights"
      title="User Analytics"
      description="A premium analytics workspace is coming soon. This page previews the experience and clearly labels sample visuals so you can see what live student insights will look like."
      actions={
        <Badge
          variant="outline"
          className="rounded-full border-primary/25 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Coming soon
        </Badge>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                <LineChart className="h-3.5 w-3.5" />
                Analytics experience in progress
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                  Understand your campus audience at a glance.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  We&apos;re building a live analytics dashboard for Dunnkayce
                  admins. When launched, it will turn student activity into clear,
                  actionable insights without relying on guesswork.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Live data planned", "No fake metrics", "Admin-ready insights"].map(
                  (item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/80 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Preview status
              </p>
              <div className="mt-4 space-y-4">
                <StatusRow
                  label="Data connection"
                  value="Not connected yet"
                  tone="muted"
                />
                <StatusRow
                  label="Visual design"
                  value="Preview ready"
                  tone="primary"
                />
                <StatusRow
                  label="Metrics shown below"
                  value="Sample data only"
                  tone="warning"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                The cards and charts below are illustrative previews. They are not
                live platform metrics.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Planned capabilities"
            title="Built for the insights admins actually need"
            description="These are the core analytics capabilities planned for this page once live data is connected."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {plannedCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <article
                  key={capability.title}
                  className="group rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {capability.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/60 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                Preview - sample data
              </p>
              <h2 className="font-display text-2xl tracking-tight text-foreground">
                Illustrative analytics preview
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                The visuals below use sample data to demonstrate layout and future
                reporting. They do not represent real user activity or live platform
                performance.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit rounded-full border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400"
            >
              Sample data only
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sampleMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-3xl border border-dashed border-border/80 bg-background/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Sample
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary/80">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {metric.change}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {metric.note}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <article className="rounded-3xl border border-dashed border-border/80 bg-background/80 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Weekly activity trend
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sample visualization of active user movement across a week.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Illustrative chart
                </span>
              </div>

              <div className="mt-6">
                <div className="flex h-56 items-end gap-2 sm:gap-3">
                  {sampleTrend.map((point, index) => (
                    <div
                      key={point.day}
                      className="flex min-w-0 flex-1 flex-col items-center gap-3"
                    >
                      <div className="relative flex h-full w-full items-end justify-center rounded-2xl bg-muted/40 px-1 pt-3">
                        <div
                          className={cn(
                            "w-full max-w-12 rounded-t-xl bg-gradient-to-t from-primary/70 to-primary/30 ring-1 ring-primary/10",
                            index === 4 && "from-primary to-primary/50",
                          )}
                          style={{ height: `${point.value}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {point.day}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span>Lower activity</span>
                  <span>Higher activity</span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-dashed border-border/80 bg-background/80 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Sample highlights
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Examples of the insights this page will surface.
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mt-5 space-y-3">
                {sampleHighlights.map((highlight) => (
                  <div
                    key={highlight.title}
                    className="rounded-2xl border border-border/60 bg-card/70 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {highlight.title}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {highlight.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {highlight.detail}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function StatusRow({ label, value, tone = "muted" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "warning" &&
            "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          tone === "muted" && "bg-muted text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
