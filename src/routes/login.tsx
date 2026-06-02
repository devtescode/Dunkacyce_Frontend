import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Dunnkayce" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "", gender: "Male" });

  useEffect(() => { if (currentUserId) navigate({ to: "/" }); }, [currentUserId, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const u = store.login(form.email.trim(), form.password);
      if (!u) return toast.error("Invalid credentials");
      toast.success(`Welcome, ${u.fullName}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/" });
    } else {
      if (!form.fullName || !form.email || !form.password) return toast.error("Fill all fields");
      const u = store.signup({ fullName: form.fullName, email: form.email.trim(), password: form.password, phone: form.phone, gender: form.gender });
      if (!u) return toast.error("Email already in use");
      toast.success("Account created");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-accent/40 via-background to-secondary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-3xl mb-3">D</div>
          <h1 className="font-display text-4xl">Dunnkayce</h1>
          <p className="text-sm text-muted-foreground">Campus food. Delivered hot.</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex rounded-lg bg-secondary p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition ${mode === m ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>{m}</button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Full name"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
                <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Gender">
                  <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </Field>
              </>
            )}
            <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Password"><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <button className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition">
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Demo accounts</p>
            <p>Admin: admin@dunnkayce.com / admin123</p>
            <p>User: student@dunnkayce.com / student123</p>
          </div>
        </div>
      </div>

      <style>{`.input { width:100%; border:1px solid var(--border); background: var(--background); border-radius:0.5rem; padding:0.55rem 0.75rem; font-size:0.875rem; outline:none; } .input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
