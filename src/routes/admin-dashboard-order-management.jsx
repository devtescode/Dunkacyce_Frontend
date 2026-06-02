import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Clock3, Package, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management — Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

function OrderManagementPage() {
  return (
    <AdminShell
      title="Order Management"
      description="View, track, and update student orders through Pending, Preparing, Ready, and Delivered statuses."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Pending", value: 18, color: "bg-amber-100 text-amber-700" },
            { label: "Preparing", value: 12, color: "bg-sky-100 text-sky-700" },
            { label: "Ready", value: 7, color: "bg-emerald-100 text-emerald-700" },
            { label: "Delivered", value: 64, color: "bg-violet-100 text-violet-700" },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-input bg-card p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Active orders</h2>
              <p className="mt-2 text-sm text-muted-foreground">Review the latest student orders and update order progress.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-input bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Order #{1200 + index}</p>
                    <p className="text-sm text-muted-foreground">Hostel H3 · Room 204 · Delivered in 25 mins</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Clock3 className="h-3.5 w-3.5" /> Preparing
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full bg-background px-3 py-1">2x Jollof Rice</span>
                  <span className="rounded-full bg-background px-3 py-1">1x Plantain</span>
                  <span className="rounded-full bg-background px-3 py-1">1x Drink</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
