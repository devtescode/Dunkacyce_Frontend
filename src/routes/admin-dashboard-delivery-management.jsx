import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  PageHeader,
  PreviewBadge,
  PreviewBanner,
  SectionHeading,
  StatusPill,
} from "@/components/admin";
import {
  ArrowUpDown,
  Clock3,
  MapPin,
  PackageCheck,
  Route as RouteIcon,
  Sparkles,
  Truck,
  UserRoundCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-delivery-management")({
  head: () => ({
    meta: [
      { title: "Delivery Management — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DeliveryManagementPage,
});

const capabilities = [
  {
    icon: RouteIcon,
    title: "Hostel & room routing",
    description:
      "Group orders by hostel, block, and room number so campus runs follow a clear path instead of ad-hoc handoffs.",
  },
  {
    icon: Clock3,
    title: "Live ETAs",
    description:
      "Track arrival windows from kitchen handoff to doorstep, with visibility into delays before they become missed deliveries.",
  },
  {
    icon: UserRoundCheck,
    title: "Driver assignment",
    description:
      "Assign the right rider or driver team based on location, workload, and current route coverage.",
  },
  {
    icon: ArrowUpDown,
    title: "Delivery priority",
    description:
      "Escalate time-sensitive orders, balance standard deliveries, and keep high-priority drops moving first.",
  },
];

const previewRoute = [
  {
    hostel: "Hostel A",
    room: "Room 101",
    window: "12:40 PM – 12:50 PM",
    priority: "High priority",
    assignee: "Rider team",
    status: "Ready for dispatch",
  },
  {
    hostel: "Hostel D",
    room: "Room 305",
    window: "12:55 PM – 1:05 PM",
    priority: "Standard",
    assignee: "Nearest driver",
    status: "Queued",
  },
  {
    hostel: "Hostel B",
    room: "Room 212",
    window: "1:10 PM – 1:20 PM",
    priority: "Standard",
    assignee: "Route bundle",
    status: "Staged",
  },
];

function priorityTone(priority) {
  return priority === "High priority" ? "gold" : "forest";
}

function statusTone(status) {
  if (status === "Ready for dispatch") return "fresh";
  if (status === "Queued") return "blue";
  return "violet";
}

function DeliveryManagementPage() {
  return (
    <AdminShell
      eyebrow="Operations"
      title="Delivery Management"
      description="A dedicated command center for campus deliveries — built to coordinate hostel routing, arrival windows, driver coverage, and priority drops with clarity."
      actions={
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold shadow-sm">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Coming soon
        </span>
      }
    >
      <div className="space-y-6">
        <PreviewBanner
          title="Delivery operations, designed for campus pace."
          description="This module is being prepared to give your team a live view of where every order is going, who is handling it, and when it is expected to arrive. The layout below is an illustrative preview of the planned experience — not live operational data."
          statusRows={[
            { label: "Module state", value: "Coming soon" },
            {
              label: "Planned coverage",
              value: "Routing · ETAs · Assignment · Priority",
            },
            { label: "Data source", value: "Illustrative sample only" },
          ]}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-warning/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800 shadow-sm dark:text-amber-200">
            <PackageCheck
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-gold"
            />
            Preview experience
          </span>
          {["Routing", "ETAs", "Assignment", "Priority"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-forest/15 bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
            >
              {item}
            </span>
          ))}
        </PreviewBanner>

        <section className="space-y-4">
          <PageHeader
            eyebrow="The roadmap"
            title="Planned capabilities"
            description="Four coordinated building blocks for calmer, faster campus delivery runs."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <AdminPanel
                  key={capability.title}
                  className="group flex h-full flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
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

        <AdminPanel className="relative isolate overflow-hidden border-dashed border-gold/40 bg-gradient-to-br from-warning/5 via-card to-card p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-warning/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
          />

          <div className="relative space-y-6">
            <SectionHeading
              eyebrow="Sample preview"
              title="Planned delivery board"
              description="Example content below shows how routing, ETAs, assignment, and priority could appear in the live module. These entries are sample placeholders and do not represent real deliveries."
              action={
                <>
                  <PreviewBadge label="Illustrative only" />
                  <StatusPill tone="gold">Sample data</StatusPill>
                </>
              }
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                {previewRoute.map((delivery) => (
                  <AdminPanel
                    as="article"
                    key={`${delivery.hostel}-${delivery.room}`}
                    className="border-border/60 bg-background/70 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <MapPin
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            {delivery.hostel}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {delivery.room}
                          </span>
                          <StatusPill tone="neutral" dot={false}>
                            Sample
                          </StatusPill>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p className="flex items-center gap-2">
                            <Clock3
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-primary"
                            />
                            <span>
                              <span className="font-medium text-foreground">
                                ETA:
                              </span>{" "}
                              {delivery.window}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Truck
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-primary"
                            />
                            <span>
                              <span className="font-medium text-foreground">
                                Assignment:
                              </span>{" "}
                              {delivery.assignee}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <StatusPill tone={priorityTone(delivery.priority)}>
                          {delivery.priority}
                        </StatusPill>
                        <StatusPill tone={statusTone(delivery.status)}>
                          {delivery.status}
                        </StatusPill>
                      </div>
                    </div>
                  </AdminPanel>
                ))}
              </div>

              <aside
                aria-label="Preview legend"
                className="rounded-2xl border border-border/70 bg-background/70 p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Preview legend
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="rounded-xl bg-card/80 p-3 ring-1 ring-border/60">
                    <p className="font-medium text-foreground">Routing context</p>
                    <p className="mt-1 leading-6 text-muted-foreground">
                      Hostel and room details anchor every delivery stop.
                    </p>
                  </div>
                  <div className="rounded-xl bg-card/80 p-3 ring-1 ring-border/60">
                    <p className="font-medium text-foreground">
                      Operational signals
                    </p>
                    <p className="mt-1 leading-6 text-muted-foreground">
                      ETAs, assignment, and priority labels will help teams act
                      quickly.
                    </p>
                  </div>
                  <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
                    <p className="font-medium text-foreground">Data status</p>
                    <p className="mt-1 leading-6 text-muted-foreground">
                      No live delivery data is connected yet. All values shown here
                      are placeholders for design preview.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
