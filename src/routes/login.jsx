import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";
import { setSessionToken, setSessionUser } from "@/lib/session";
import { ApiError, useLoginMutation } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — DUNNKAYCE" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const data = await loginMutation.mutateAsync({ email, password });
      const token = data.token ?? data.accessToken ?? "";
      const currentUser = data.user ?? data.admin ?? null;

      if (!currentUser) {
        toast.error("Login failed: invalid user data");
        return;
      }

      const normalizedUser = { ...currentUser, id: currentUser.id ?? currentUser._id };
      store.syncUser(normalizedUser);
      if (token) {
        store.setAuthToken(token);
        setSessionToken(token);
      }
      setSessionUser(normalizedUser);
      toast.success(`Welcome back, ${normalizedUser.fullName?.split(" ")[0] || "there"}!`);
      navigate({ to: "/user-dashboard", replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.payload?.message || err.message || "Login failed");
        return;
      }
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,201,40,0.16),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(32,164,71,0.12),transparent_30%)]" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary">Welcome back</p>
          <h1 className="mt-5 max-w-xl text-5xl font-black tracking-tight text-primary">
            Good food.
            <span className="block text-foreground">Zero hassle.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Log in to browse today’s favourites, manage your cart, and get fresh campus meals delivered fast.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">D</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Log in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Email" htmlFor="login-email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
              {!loginMutation.isPending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}