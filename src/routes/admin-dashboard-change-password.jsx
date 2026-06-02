import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-change-password")({
  head: () => ({ meta: [{ title: "Change Password — Dunnkayce Admin" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  return (
    <AdminShell
      title="Change Password"
      description="Allow admins to securely update their account password."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_0.9fr]">
        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Secure account management</p>
              <p className="mt-2 text-sm text-muted-foreground">Update your admin password and rotate credentials regularly.</p>
            </div>
          </div>
          <form className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">Current password</span>
              <input type="password" className="mt-2 w-full rounded-3xl border border-input bg-card px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">New password</span>
              <input type="password" className="mt-2 w-full rounded-3xl border border-input bg-card px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="text-sm font-medium text-foreground">Confirm new password</span>
              <input type="password" className="mt-2 w-full rounded-3xl border border-input bg-card px-4 py-3 text-sm" />
            </label>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              <Lock className="h-4 w-4" /> Save password
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Password best practices</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• Use a unique password not shared with other systems.</li>
            <li>• Include letters, numbers, and a special character.</li>
            <li>• Change passwords regularly for strong account security.</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
