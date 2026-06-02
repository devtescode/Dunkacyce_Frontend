import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Box, Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-food-management")({
  head: () => ({ meta: [{ title: "Food Management — Dunnkayce Admin" }] }),
  component: FoodManagementPage,
});

function FoodManagementPage() {
  return (
    <AdminShell
      title="Food Management"
      description="Add, edit, delete, and manage food items with images, prices, descriptions, stock, and availability."
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Foods</p>
                <h2 className="text-2xl font-semibold">Manage the menu</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Add food item
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-input bg-background p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">Protein Bowl {index + 1}</p>
                      <p className="text-sm text-muted-foreground">Grilled chicken, rice, veggies, and soup.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Available</span>
                      <span className="font-semibold">₦1,500</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-full border border-input px-3 py-2 text-sm hover:bg-secondary">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Key food controls</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage stock, preview featured items, and ensure availability status remains accurate across campus.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-primary/5 p-4 text-sm">Track image assets, pricing, stock, and category tags in one place.</div>
              <div className="rounded-2xl bg-primary/5 p-4 text-sm">Use quick actions to set availability, update pricing, and publish menu items instantly.</div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
