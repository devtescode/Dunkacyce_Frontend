import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Change Password — Dunnkayce" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const [f, setF] = useState({ old: "", next: "", confirm: "" });
  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  if (!user) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.next.length < 6) return toast.error("New password must be 6+ characters");
    if (f.next !== f.confirm) return toast.error("Passwords do not match");
    const ok = store.changePassword(f.old, f.next);
    if (!ok) return toast.error("Old password incorrect");
    toast.success("Password updated");
    setF({ old: "", next: "", confirm: "" });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Change Password</h1>
      <form onSubmit={submit} className="rounded-xl border bg-card p-6 space-y-4">
        {[
          { k: "old", l: "Current password" },
          { k: "next", l: "New password" },
          { k: "confirm", l: "Confirm new password" },
        ].map(({ k, l }) => (
          <label key={k} className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{l}</span>
            <input type="password" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <button className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">Update password</button>
      </form>
    </main>
  );
}
