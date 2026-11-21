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
import {
  AdminPanel,
  PreviewBadge,
  PreviewBanner,
  SectionHeading as KitSectionHeading,
  StatCard,
  StatusPill,
} from "@/components/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-user-analytics")({
  head: () => ({
    meta: [
      { title: "User Analytics — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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
        <div className="flex flex-wrap items-center gap-2">
          <PreviewBadge className="border-gold/60 bg-white/10 text-gold dark:text-gold" />
          <StatusPill
            tone="gold"
            className="border-gold/40 bg-white/10 text-gold dark:text-gold"
          >
            <Sparkles aria-hidden="true" className="h-3 w-3" />
            Coming soon
          </StatusPill>
        </div>
      }
    >
      <div className="space-y-6">
        <PreviewBanner
          title="User analytics preview"
          description={
            <>
              <span className="font-semibold text-foreground">
                Understand your campus audience at a glance.
              </span>{" "}
              We&apos;re building a live analytics dashboard for Dunnkayce admins.
              When launched, it will turn student activity into clear, actionable
              insights without relying on guesswork.
            </>
          }
          className="from-warning/20"
        >
          <AdminPanel
            as="div"
            className="w-full space-y-3 border-dashed border-gold/40 bg-card/85 p-4 sm:w-80"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
              Preview status
            </p>
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
            <p className="text-xs leading-5 text-muted-foreground">
              The cards and charts below are illustrative previews. They are not
              live platform metrics.
            </p>
          </AdminPanel>
        </PreviewBanner>

        <AdminPanel
          as="div"
          className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5"
        >
          <LineChart aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Analytics experience in progress
          </span>
          {["Live data planned", "No live metrics", "Admin-ready insights"].map(
            (item) => (
              <StatusPill
                key={item}
                tone={item === "No live metrics" ? "gold" : "forest"}
                dot={false}
              >
                {item}
              </StatusPill>
            ),
          )}
        </AdminPanel>

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
                <AdminPanel
                  as="article"
                  key={capability.title}
                  className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {capability.description}
                  </p>
                </AdminPanel>
              );
            })}
          </div>
        </section>

        <AdminPanel
          as="section"
          className="border-dashed border-gold/40 p-5 sm:p-6"
        >
          <SectionHeading
            eyebrow="Preview - sample data"
            title="Illustrative analytics preview"
            description="The visuals below use sample data to demonstrate layout and future reporting. They do not represent real user activity or live platform performance."
            action={<StatusPill tone="gold">Sample data only</StatusPill>}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sampleMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <StatCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  icon={Icon}
                  tone="forest"
                  className="border-dashed border-gold/30 bg-card/70"
                  hint={
                    <span className="block space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="gold" dot={false} className="px-2 py-0.5 text-[10px]">
                          Sample
                        </StatusPill>
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                          {metric.change}
                        </span>
                      </span>
                      <span className="block">{metric.note}</span>
                    </span>
                  }
                />
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <AdminPanel
              as="article"
              className="border-dashed border-border/80 bg-background/60 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Weekly activity trend
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sample visualization of active user movement across a week.
                  </p>
                </div>
                <StatusPill tone="gold" dot={false}>
                  Illustrative chart
                </StatusPill>
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
                            "w-full max-w-12 rounded-t-xl bg-gradient-to-t from-primary/70 to-primary/30 ring-1 ring-inset ring-primary/15",
                            index === 4 && "from-forest to-gold/70 ring-gold/40",
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
            </AdminPanel>

            <AdminPanel
              as="article"
              className="border-dashed border-border/80 bg-background/60 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Sample highlights
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Examples of the insights this page will surface.
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 aria-hidden="true" className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {sampleHighlights.map((highlight) => (
                  <div
                    key={highlight.title}
                    className="rounded-2xl border border-border/70 bg-card/80 p-4"
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
            </AdminPanel>
          </div>
        </AdminPanel>

        <AdminPanel
          as="footer"
          className="flex flex-col gap-4 border-dashed border-gold/50 bg-warning/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <PreviewBadge
              label="Preview · sample data only"
              className="h-fit shrink-0"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Sample data only — not live analytics
              </p>
              <p className="max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                Every figure, trend, and highlight on this page is illustrative.
                No user activity, orders, or platform metrics have been connected.
                This preview is hidden from navigation and intentionally excluded
                from search indexing.
              </p>
            </div>
          </div>
          <StatusPill tone="gold" className="w-fit shrink-0">
            No live metrics
          </StatusPill>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <KitSectionHeading
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={action}
    />
  );
}

function StatusRow({ label, value, tone = "muted" }) {
  const kitTone =
    tone === "primary" ? "forest" : tone === "warning" ? "gold" : "neutral";

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StatusPill tone={kitTone} className="shrink-0">
        {value}
      </StatusPill>
    </div>
  );
}
