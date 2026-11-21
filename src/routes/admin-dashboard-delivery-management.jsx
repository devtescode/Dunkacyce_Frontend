import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
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
  head: () => ({ meta: [{ title: "Delivery Management — Dunnkayce Admin" }] }),
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

function DeliveryManagementPage() {
  return (
    <AdminShell
      eyebrow="Operations"
      title="Delivery Management"
      description="A dedicated command center for campus deliveries — built to coordinate hostel routing, arrival windows, driver coverage, and priority drops with clarity."
      actions={
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </span>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <PackageCheck className="h-3.5 w-3.5 text-primary" />
                Preview experience
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  Delivery operations, designed for campus pace.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This module is being prepared to give your team a live view of
                  where every order is going, who is handling it, and when it is
                  expected to arrive. The layout below is an illustrative preview
                  of the planned experience — not live operational data.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-background/70 p-4 shadow-sm sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Planned coverage
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Routing", "ETAs", "Assignment", "Priority"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <article
                key={capability.title}
                className="group rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {capability.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {capability.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-dashed border-border/80 bg-card/60 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Sample preview
                </p>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
                  Illustrative only
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Planned delivery board
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Example content below shows how routing, ETAs, assignment, and
                priority could appear in the live module. These entries are sample
                placeholders and do not represent real deliveries.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary/60" />
              Sample data
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              {previewRoute.map((delivery) => (
                <div
                  key={`${delivery.hostel}-${delivery.room}`}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          <MapPin className="h-3.5 w-3.5" />
                          {delivery.hostel}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {delivery.room}
                        </span>
                        <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          Sample
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-primary/80" />
                          <span>
                            <span className="font-medium text-foreground/80">ETA:</span>{" "}
                            {delivery.window}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary/80" />
                          <span>
                            <span className="font-medium text-foreground/80">
                              Assignment:
                            </span>{" "}
                            {delivery.assignee}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                        {delivery.priority}
                      </span>
                      <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-border/70 bg-background/70 p-5">
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
                  <p className="font-medium text-foreground">Operational signals</p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    ETAs, assignment, and priority labels will help teams act quickly.
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="font-medium text-foreground">Data status</p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    No live delivery data is connected yet. All values shown here
                    are placeholders for design preview.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
