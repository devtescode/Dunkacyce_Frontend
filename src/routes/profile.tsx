import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Dunnkayce" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", gender: "Male" });

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    else setForm({ fullName: user.fullName, email: user.email, phone: user.phone, gender: user.gender });
  }, [user, navigate]);

  if (!user) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile(form);
    toast.success("Profile updated");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Profile</h1>
      <form onSubmit={save} className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-3xl">{user.fullName[0]}</div>
          <div>
            <p className="font-semibold text-lg">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.role === "admin" ? "Administrator" : "Student"}</p>
          </div>
        </div>
        {[
          { k: "fullName", l: "Full name" },
          { k: "email", l: "Email" },
          { k: "phone", l: "Phone" },
        ].map(({ k, l }) => (
          <label key={k} className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{l}</span>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </label>
        ))}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Gender</span>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </label>
        <button className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">Save changes</button>
      </form>
    </main>
  );
}
