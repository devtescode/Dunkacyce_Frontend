import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { CreditCard, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-payment-tracking")({
  head: () => ({ meta: [{ title: "Payment Tracking — Dunnkayce Admin" }] }),
  component: PaymentTrackingPage,
});

function PaymentTrackingPage() {
  return (
    <AdminShell
      title="Payment Tracking"
      description="Monitor all student payments and verify manual payments with confidence."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { label: "Total paid", value: "₦98.3K", icon: Wallet },
          { label: "Pending", value: "24", icon: CreditCard },
          { label: "Verified", value: "96%", icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-input bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Recent payment activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">Verify manual deposits and approve records from the finance queue.</p>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-3xl border border-input bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Student {index + 1}</p>
                <p className="text-sm text-muted-foreground">Transfer reference: TNX-{3400 + index}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-background px-3 py-1">₦{1_800 + index * 200}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Confirmed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
