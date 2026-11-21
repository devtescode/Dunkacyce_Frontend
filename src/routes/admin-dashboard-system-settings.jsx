import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Clock3,
  Lock,
  MessageCircle,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  PreviewBadge,
  PreviewBanner,
  SectionHeading,
  StatusPill,
} from "@/components/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-system-settings")({
  head: () => ({
    meta: [
      { title: "System Settings — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SystemSettingsPage,
});

const capabilityCards = [
  {
    icon: Truck,
    title: "Delivery fees",
    description:
      "Control campus delivery pricing, hostel surcharges, and special delivery windows from one place.",
    status: "Planned",
    items: ["Base delivery fee", "Hostel or distance rules", "Promo and rush-hour adjustments"],
    accent: "from-primary/15 via-primary/5 to-transparent",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp contact",
    description:
      "Set the official support line students use for order help, payment questions, and urgent updates.",
    status: "Planned",
    items: ["Primary WhatsApp number", "Support display name", "Fallback contact channel"],
    accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  },
  {
    icon: Clock3,
    title: "Ordering window",
    description:
      "Define when the kitchen accepts orders, including campus schedules, breaks, and cutoff times.",
    status: "Planned",
    items: ["Daily open and close times", "Temporary closures", "Meal-window scheduling"],
    accent: "from-gold/20 via-gold/5 to-transparent",
  },
  {
    icon: ShieldCheck,
    title: "Policies & alerts",
    description:
      "Publish operational policies and platform notices so students always see current service expectations.",
    status: "Planned",
    items: ["Delivery policy notes", "Maintenance notices", "Emergency service alerts"],
    accent: "from-sky-500/15 via-sky-500/5 to-transparent",
  },
];

const previewSettings = [
  {
    icon: Truck,
    label: "Delivery fee",
    value: "₦150",
    note: "Sample campus delivery rate",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp support",
    value: "+234 800 000 0000",
    note: "Sample support contact",
  },
  {
    icon: Clock3,
    label: "Ordering window",
    value: "8:00 AM – 10:00 PM",
    note: "Sample daily availability",
  },
  {
    icon: Bell,
    label: "Platform alerts",
    value: "Maintenance and policy notices",
    note: "Sample communication channel",
  },
];

function SystemSettingsPage() {
  return (
    <AdminShell
      eyebrow="Platform configuration"
      title="System Settings"
      description="A preview of the controls that will manage delivery, support, ordering hours, and campus policies. Configuration is not connected yet."
      actions={<PreviewBadge label="Coming soon" />}
    >
      <div className="space-y-6">
        <PreviewBanner
          title="Configuration workspace, ready for wiring"
          description="This screen is a polished preview of upcoming admin controls. Values shown below are examples only and cannot be edited or saved until settings are connected to the backend."
          statusRows={[
            { label: "Status", value: "Preview only" },
            {
              label: "Data source",
              value: (
                <StatusPill tone="gold" dot={false}>
                  <Wrench className="h-3 w-3" aria-hidden="true" />
                  Not connected
                </StatusPill>
              ),
            },
            { label: "Saving", value: "Unavailable" },
          ]}
        >
          <PreviewBadge label="Preview · Sample data only" />
        </PreviewBanner>

        <AdminPanel
          as="div"
          className="flex flex-col gap-3 border-dashed border-gold/50 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-warning/15 text-forest-deep dark:text-gold"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">Preview workspace.</span> Every value on this page is
              illustrative sample data. Nothing here is stored, editable, or connected to live services.
            </p>
          </div>
          <StatusPill tone="gold" className="w-fit shrink-0">
            Not connected
          </StatusPill>
        </AdminPanel>

        <section aria-label="Planned capabilities" className="space-y-4">
          <SectionHeading
            eyebrow="Planned capabilities"
            title="What this page will manage"
            description="Each area below is designed for real operations, but currently shown as a non-editable product preview."
            action={<PreviewBadge label="Preview · No live controls" />}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <AdminPanel
                  key={card.title}
                  as="article"
                  className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-80",
                      card.accent,
                    )}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-warning/15 text-forest-deep dark:text-gold"
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <StatusPill tone="gold" dot={false}>
                          {card.status}
                        </StatusPill>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
                    </div>

                    <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Planned controls
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {card.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-dashed border-border/70 pt-4 text-xs font-medium text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Not connected to live settings</span>
                    </div>
                  </div>
                </AdminPanel>
              );
            })}
          </div>
        </section>

        <AdminPanel as="section" aria-label="Preview snapshot" className="p-5 sm:p-7">
          <SectionHeading
            eyebrow="Preview snapshot"
            title="Example configuration values"
            description="These sample values illustrate the kind of information this page will hold. They are read-only previews and are not stored, editable, or saved."
            action={
              <StatusPill tone="neutral" dot={false}>
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Read-only preview
              </StatusPill>
            }
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {previewSettings.map((setting) => {
              const Icon = setting.icon;
              return (
                <AdminPanel
                  key={setting.label}
                  as="div"
                  className="border-border/70 bg-background/60 p-4 shadow-none sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                        <StatusPill tone="gold" dot={false}>
                          Preview
                        </StatusPill>
                      </div>
                      <p className="mt-2 text-base font-medium text-foreground sm:text-lg">{setting.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{setting.note}</p>
                    </div>
                  </div>
                </AdminPanel>
              );
            })}
          </div>

          <AdminPanel as="div" className="mt-6 border-gold/40 bg-warning/10 p-4 shadow-none sm:p-5">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-warning/15 text-forest-deep dark:text-gold"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">No changes can be saved here.</span> When settings are
                  connected, this page will support live configuration with proper validation and persistence.
                </p>
                <PreviewBadge label="Preview · Sample data only" />
              </div>
            </div>
          </AdminPanel>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
