import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { getSessionUser } from "@/lib/session";
import { useChangePasswordMutation, ApiError } from "@/lib/api";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Change Password — DUNNKAYCE" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSessionUser());
  const changePassword = useChangePasswordMutation();
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });

  useEffect(() => {
    if (!user) {
      const sessionUser = getSessionUser();
      if (sessionUser) setUser(sessionUser);
      else navigate({ to: "/login", replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.old.trim()) return toast.error("Current password is required");
    if (form.next.length < 6) return toast.error("New password must be at least 6 characters");
    if (form.next !== form.confirm) return toast.error("Passwords do not match");
    if (form.old === form.next) return toast.error("New password must be different from current password");

    try {
      const data = await changePassword.mutateAsync({
        oldPassword: form.old,
        newPassword: form.next,
      });
      toast.success(data?.message || "Password updated successfully");
      setForm({ old: "", next: "", confirm: "" });
    } catch (err) {
      const message =
        (err instanceof ApiError && err.payload?.message) ||
        err?.message ||
        "Failed to update password";
      toast.error(message);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-success">Security</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Change password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Keep your account secure with a strong password.</p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Update your password</h2>
            <p className="text-sm text-muted-foreground">Use at least 6 characters.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <PasswordField
            id="current-password"
            label="Current password"
            autoComplete="current-password"
            value={form.old}
            onChange={(e) => setForm({ ...form, old: e.target.value })}
            placeholder="Enter current password"
          />
          <PasswordField
            id="new-password"
            label="New password"
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            placeholder="Enter new password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="Confirm new password"
          />

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {changePassword.isPending ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}

function PasswordField({ id, label, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type="password"
          className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          required
          {...props}
        />
      </div>
    </div>
  );
}