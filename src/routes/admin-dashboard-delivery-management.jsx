import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-delivery-management")({
  head: () => ({ meta: [{ title: "Delivery Management — Dunnkayce Admin" }] }),
  component: DeliveryManagementPage,
});

function DeliveryManagementPage() {
  return (
    <AdminShell
      title="Delivery Management"
      description="Manage food deliveries based on hostel and room numbers and keep delivery routes organized."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Hostel deliveries</p>
              <p className="mt-2 text-3xl font-semibold">27 active</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Route students by hostel and room for faster campus delivery.</p>
        </div>

        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Delivery capacity</p>
              <p className="mt-2 text-3xl font-semibold">6 drivers</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Monitor capacity and assign deliveries to the nearest driver team.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Delivery schedule</h2>
        <p className="mt-2 text-sm text-muted-foreground">Keep each order aligned with hostels, arrival windows, and delivery priority.</p>
        <div className="mt-6 space-y-4">
          {[
            { hostel: "H1", room: "101", eta: "12:40 PM" },
            { hostel: "H4", room: "305", eta: "12:55 PM" },
            { hostel: "H2", room: "212", eta: "1:10 PM" },
          ].map((delivery) => (
            <div key={`${delivery.hostel}-${delivery.room}`} className="rounded-3xl border border-input bg-card p-4 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{delivery.hostel} · Room {delivery.room}</p>
                <p className="text-sm text-muted-foreground">Ready for pickup</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{delivery.eta}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
