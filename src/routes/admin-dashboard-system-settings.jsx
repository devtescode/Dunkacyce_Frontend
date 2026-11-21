import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Clock3,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-system-settings")({
  head: () => ({ meta: [{ title: "System Settings — Dunnkayce Admin" }] }),
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
    accent: "from-amber-500/15 via-amber-500/5 to-transparent",
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

function StatusPill({ children, tone = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "primary"
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border/70 bg-background/80 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SystemSettingsPage() {
  return (
    <AdminShell
      eyebrow="Platform configuration"
      title="System Settings"
      description="A preview of the controls that will manage delivery, support, ordering hours, and campus policies. Configuration is not connected yet."
      actions={
        <StatusPill tone="primary" className="bg-card/90 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Coming soon
        </StatusPill>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_38%)]"
          />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl space-y-4">
              <StatusPill tone="primary">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                Not connected
              </StatusPill>
              <div className="space-y-3">
                <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  Configuration workspace, ready for wiring
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This screen is a polished preview of upcoming admin controls. Values shown below are examples only and
                  cannot be edited or saved until settings are connected to the backend.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:grid-cols-1">
              {[
                { label: "Status", value: "Preview only" },
                { label: "Data source", value: "Not connected" },
                { label: "Saving", value: "Unavailable" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-xs"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="planned-capabilities" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">Planned capabilities</p>
              <h2 id="planned-capabilities" className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                What this page will manage
              </h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Each area below is designed for real operations, but currently shown as a non-editable product preview.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br opacity-90",
                      card.accent,
                    )}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-primary shadow-xs">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <StatusPill>{card.status}</StatusPill>
                    </div>

                    <div className="mt-5 space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
                    </div>

                    <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
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

                    <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Not connected to live settings</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="preview-snapshot"
          className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur-sm sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">Preview snapshot</p>
              <h2 id="preview-snapshot" className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                Example configuration values
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                These sample values illustrate the kind of information this page will hold. They are read-only previews and
                are not stored, editable, or saved.
              </p>
            </div>
            <StatusPill className="w-fit">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Read-only preview
            </StatusPill>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {previewSettings.map((setting) => {
              const Icon = setting.icon;
              return (
                <div
                  key={setting.label}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Preview
                        </span>
                      </div>
                      <p className="mt-2 text-base font-medium text-foreground sm:text-lg">{setting.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{setting.note}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <span className="font-semibold text-foreground">No changes can be saved here.</span> When settings are
              connected, this page will support live configuration with proper validation and persistence.
            </p>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
