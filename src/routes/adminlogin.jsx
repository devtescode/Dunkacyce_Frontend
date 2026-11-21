import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock, Mail, User, ArrowRight } from "lucide-react";
import {
  ApiError,
  useAdminExistsQuery,
  useAdminLoginMutation,
  useAdminRegisterMutation,
} from "@/lib/api";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import logo from "../assest/elizade_university_ilara_mokin_profile.jpg";

export const Route = createFileRoute("/adminlogin")({
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(null); // null = loading check

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const {
    data: adminExists,
    isPending: isAdminExistsPending,
    isError: isAdminExistsError,
  } = useAdminExistsQuery();

  const registerMutation = useAdminRegisterMutation();
  const loginMutation = useAdminLoginMutation();

  const loading = registerMutation.isPending || loginMutation.isPending;

  // 🔥 check if admin exists (safe even if network fails)
  useEffect(() => {
    if (
      !isAdminExistsPending &&
      !isAdminExistsError &&
      typeof adminExists === "boolean"
    ) {
      setIsRegistered(adminExists);
    }
  }, [adminExists, isAdminExistsPending, isAdminExistsError]);

  // ⚡ NETWORK FAIL SAFE: still allow login page
  useEffect(() => {
    if (!isAdminExistsError) return;

    toast.error("Network unstable");
    const timer = setTimeout(() => {
      setIsRegistered(true); // assume admin exists → go login mode
    }, 800);

    return () => clearTimeout(timer);
  }, [isAdminExistsError]);

  // =====================
  // REGISTER ADMIN
  // =====================
  const registerAdmin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.username || !form.password) {
      return toast.error("Fill all fields");
    }

    try {
      await registerMutation.mutateAsync(form);

      toast.success("Admin registered 🎉");

      setIsRegistered(true); // switch to login UI
    } catch (err) {
      if (err instanceof ApiError) {
        return toast.error(err.payload?.message || "Registration failed");
      }

      toast.error("Network error");
      setTimeout(() => navigate({ to: "/adminlogin" }), 800);
    }
  };

  // =====================
  // LOGIN ADMIN
  // =====================
  const loginAdmin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error("Fill all fields");
    }

    try {
      const data = await loginMutation.mutateAsync({
        email: form.email,
        password: form.password,
      });

      const admin = data.admin ?? data.user ?? data;
      if (!admin || typeof admin !== "object") {
        return toast.error("Login failed");
      }

      toast.success("Welcome Admin 🔥");

      sessionStorage.setItem("adminToken", data.token ?? data.accessToken ?? "");
      sessionStorage.setItem("admin", JSON.stringify(admin));

      navigate({ to: "/admin-dashboard", replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        return toast.error(err.payload?.message || "Login failed");
      }

      toast.error("Network issue");
      setTimeout(() => {
        navigate({ to: "/adminlogin", replace: true });
      }, 800);
    }
  };

  // loading state
  if (isRegistered === null) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary mb-3">
            Dunnkayce Admin
          </p>
          <DunnkayceLoader
            variant="compact"
            label="Loading admin system"
            caption="Unlocking the kitchen controls."
            className="mx-auto w-full justify-center"
          />
        </div>
      </div>
    );
  }

  const isSetup = !isRegistered;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-primary/5 grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-10 xl:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_40%)]" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/95 p-1 shadow-sm">
                <img
                  src={logo}
                  alt="Dunnkayce Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/80">
                  Dunnkayce
                </p>
                <p className="text-lg font-semibold leading-tight">Admin Console</p>
              </div>
            </div>

            <div className="mt-14 max-w-md">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/90 ring-1 ring-white/15">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Secure access
              </p>
              <h1 className="mt-5 text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
                Manage Dunnkayce with confidence.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/85">
                {isSetup
                  ? "Set up the first administrator account to secure kitchen operations, orders, and campus delivery management."
                  : "Sign in to access the admin dashboard, monitor operations, and keep campus service running smoothly."}
              </p>
            </div>
          </div>

          <div className="relative mt-12 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-sm font-semibold">Trusted controls</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Protected access for administrative actions.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-sm font-semibold">Kitchen operations</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Keep orders, menus, and service in sync.
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-card p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="mb-8">
            <div className="lg:hidden mb-6 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl border border-border bg-background p-1.5 shadow-sm">
                <img
                  src={logo}
                  alt="Dunnkayce Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Dunnkayce
                </p>
                <p className="text-base font-semibold text-foreground">Admin Panel</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {isSetup ? "First-time setup" : "Admin access"}
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {isSetup ? "Create Admin Account" : "Admin Login"}
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isSetup
                ? "Create the primary administrator account to initialize secure access to the Dunnkayce admin dashboard."
                : "Enter your admin credentials to continue to the dashboard."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/60 p-5 sm:p-6 shadow-sm">
            {/* ===================== */}
            {/* REGISTER MODE */}
            {/* ===================== */}
            {!isRegistered && (
              <form onSubmit={registerAdmin} className="space-y-5" noValidate>
                <Field label="Username" htmlFor="admin-username">
                  <InputShell icon={User}>
                    <input
                      id="admin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
                      placeholder="Enter admin username"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field label="Email" htmlFor="admin-register-email">
                  <InputShell icon={Mail}>
                    <input
                      id="admin-register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
                      placeholder="admin@dunnkayce.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field label="Password" htmlFor="admin-register-password">
                  <InputShell icon={Lock}>
                    <input
                      id="admin-register-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground"
                        aria-hidden="true"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Admin
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===================== */}
            {/* LOGIN MODE */}
            {/* ===================== */}
            {isRegistered && (
              <form onSubmit={loginAdmin} className="space-y-5" noValidate>
                <Field label="Email" htmlFor="admin-login-email">
                  <InputShell icon={Mail}>
                    <input
                      id="admin-login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
                      placeholder="admin@dunnkayce.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field label="Password" htmlFor="admin-login-password">
                  <InputShell icon={Lock}>
                    <input
                      id="admin-login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground"
                        aria-hidden="true"
                      />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Admin Login
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Authorized personnel only. Activity may be monitored for security and operational integrity.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function InputShell({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-3 shadow-xs transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      {children}
    </div>
  );
}
