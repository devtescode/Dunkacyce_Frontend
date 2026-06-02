import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin-dashboard-system-settings")({
  head: () => ({ meta: [{ title: "System Settings — Dunnkayce Admin" }] }),
  component: SystemSettingsPage,
});

function SystemSettingsPage() {
  return (
    <AdminShell
      title="System Settings"
      description="Configure delivery fees, WhatsApp contact, and other platform settings."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Platform settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">Update core settings that affect pricing and support communications.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">Delivery fee</span>
              <input className="mt-2 w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm" defaultValue="₦150" />
            </label>
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">WhatsApp support</span>
              <input className="mt-2 w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm" defaultValue="+2348000000000" />
            </label>
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">Live ordering window</span>
              <input className="mt-2 w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm" defaultValue="8:00 AM - 10:00 PM" />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Policy & support</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use these settings to keep the platform aligned with campus delivery policies.</p>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <div className="rounded-3xl bg-slate-50 p-4">Add messaging contact details and emergency support for students.</div>
            <div className="rounded-3xl bg-slate-50 p-4">Update delivery fee rules for hostels or special meal windows.</div>
            <div className="rounded-3xl bg-slate-50 p-4">Reserve a place for system maintenance notices and platform alerts.</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
