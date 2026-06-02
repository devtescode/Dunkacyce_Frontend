import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { BarChart3, Users } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-user-analytics")({
  head: () => ({ meta: [{ title: "User Analytics — Dunnkayce Admin" }] }),
  component: UserAnalyticsPage,
});

function UserAnalyticsPage() {
  return (
    <AdminShell
      title="User Analytics"
      description="View registered students, active users, and user activity across the platform."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Registered students</p>
              <p className="mt-2 text-3xl font-semibold">1,235</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Total campus users currently registered in the system.</p>
        </div>

        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Active users today</p>
              <p className="mt-2 text-3xl font-semibold">482</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Track daily platform usage and student ordering behavior.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-input bg-background p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">A clear view of student trends helps guide menu, promos, and capacity planning.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-input bg-card p-4">
            <p className="text-sm text-muted-foreground">Repeat order rate</p>
            <p className="mt-3 text-2xl font-semibold">64%</p>
          </div>
          <div className="rounded-3xl border border-input bg-card p-4">
            <p className="text-sm text-muted-foreground">Average session length</p>
            <p className="mt-3 text-2xl font-semibold">18m</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
