import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  UtensilsCrossed,
} from "lucide-react";
import {
  ApiError,
  useAdminExistsQuery,
  useAdminLoginMutation,
  useAdminRegisterMutation,
} from "@/lib/api";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { AdminPanel, FoodImage, StatusPill, ThemeToggle } from "@/components/admin";
import { persistAdminSession } from "@/lib/adminSession";
import { FOOD_HIGHLIGHTS } from "@/lib/foodImages";
import { cn } from "@/lib/utils";
import logo from "../assest/elizade_university_ilara_mokin_profile.jpg";

export const Route = createFileRoute("/adminlogin")({
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(null); // null = loading check
  const [fieldErrors, setFieldErrors] = useState({});
  const [justRegistered, setJustRegistered] = useState(false);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    bootstrapKey: "",
  });

  const {
    data: adminExists,
    isPending: isAdminExistsPending,
    isError: isAdminExistsError,
    refetch: refetchAdminExists,
  } = useAdminExistsQuery();

  const registerMutation = useAdminRegisterMutation();
  const loginMutation = useAdminLoginMutation();

  const loading = registerMutation.isPending || loginMutation.isPending;

  const updateField = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) =>
      current[key] ? { ...current, [key]: undefined } : current,
    );
  };

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

    const nextErrors = {};
    if (!form.email) nextErrors.email = "Email is required";
    if (!form.username) nextErrors.username = "Username is required";
    if (!form.password) nextErrors.password = "Password is required";
    setFieldErrors(nextErrors);

    if (!form.email || !form.username || !form.password) {
      return toast.error("Fill all fields");
    }

    try {
      const { bootstrapKey, ...registerDetails } = form;
      const payload = bootstrapKey?.trim()
        ? { ...registerDetails, bootstrapKey: bootstrapKey.trim() }
        : registerDetails;
      await registerMutation.mutateAsync(payload);

      // The first account created in setup mode is a REGULAR admin. Super Admin
      // must be activated separately from the Super Admin page using the
      // server-side activation key — never from client-side setup state.
      toast.success("Admin registered 🎉");

      setForm((current) => ({ ...current, username: "", password: "", bootstrapKey: "" }));
      setFieldErrors({});
      setJustRegistered(true);
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

    const nextErrors = {};
    if (!form.email) nextErrors.email = "Email is required";
    if (!form.password) nextErrors.password = "Password is required";
    setFieldErrors(nextErrors);

    if (!form.email || !form.password) {
      return toast.error("Fill all fields");
    }

    try {
      const data = await loginMutation.mutateAsync({
        email: form.email,
        password: form.password,
      });

      const admin = data.admin ?? data.user ?? data;
      const token = data.token ?? data.accessToken ?? "";
      if (!admin || typeof admin !== "object" || !token) {
        return toast.error("Login failed");
      }

      // Prefer the backend-provided role; older responses may only expose it
      // at the top level.
      const sessionAdmin =
        !admin.role && data.role ? { ...admin, role: data.role } : admin;

      toast.success("Welcome Admin 🔥");

      persistAdminSession(token, sessionAdmin);

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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-forest/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl"
        />
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle compact />
        </div>
        <AdminPanel className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="admin-eyebrow mb-3">Dunnkayce Admin</p>
          <DunnkayceLoader
            variant="compact"
            label="Loading admin system"
            caption="Unlocking the kitchen controls."
            className="mx-auto w-full justify-center"
          />
        </AdminPanel>
      </div>
    );
  }

  const isSetup = !isRegistered;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-3 sm:p-6 lg:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-forest/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
      />

      <AdminPanel className="relative grid w-full max-w-6xl overflow-hidden lg:grid-cols-[1.06fr_0.94fr]">
        <BrandPanel isSetup={isSetup} />

        {/* Form panel */}
        <div className="flex min-w-0 flex-col justify-center bg-card px-5 py-7 sm:px-8 sm:py-10 lg:px-10 xl:px-12">
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={isSetup ? "gold" : "forest"}>
                {isSetup ? "First-time setup" : "Admin access"}
              </StatusPill>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Authorized personnel only
              </span>
            </div>
            <h2 className="mt-4 font-display text-3xl uppercase tracking-wide text-foreground sm:text-4xl">
              {isSetup ? "Create Admin Account" : "Admin Login"}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {isSetup
                ? "Create the primary administrator account to initialize secure access to the Dunnkayce admin dashboard."
                : "Enter your admin credentials to continue to the dashboard."}
            </p>
          </div>

          {justRegistered && isRegistered ? (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-3"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-foreground">
                Admin account created. Sign in with your new credentials to continue.
              </p>
            </div>
          ) : null}

          {isAdminExistsError ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
              <div className="flex min-w-0 items-start gap-2">
                <RefreshCw
                  className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-foreground">
                  Connection check failed — showing admin sign-in. You can retry the check.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchAdminExists()}
                disabled={isAdminExistsPending}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          <AdminPanel className="bg-background/60 p-5 shadow-sm sm:p-6">
            {/* ===================== */}
            {/* REGISTER MODE */}
            {/* ===================== */}
            {!isRegistered && (
              <form onSubmit={registerAdmin} className="space-y-5" noValidate>
                <Field
                  label="Username"
                  htmlFor="admin-username"
                  error={fieldErrors.username}
                >
                  <InputShell icon={User} invalid={Boolean(fieldErrors.username)}>
                    <input
                      id="admin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter admin username"
                      value={form.username}
                      onChange={updateField("username")}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={
                        fieldErrors.username ? "admin-username-error" : undefined
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field label="Email" htmlFor="admin-register-email" error={fieldErrors.email}>
                  <InputShell icon={Mail} invalid={Boolean(fieldErrors.email)}>
                    <input
                      id="admin-register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="admin@dunnkayce.com"
                      value={form.email}
                      onChange={updateField("email")}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "admin-register-email-error" : undefined
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field
                  label="Password"
                  htmlFor="admin-register-password"
                  error={fieldErrors.password}
                >
                  <InputShell icon={Lock} invalid={Boolean(fieldErrors.password)}>
                    <input
                      id="admin-register-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={updateField("password")}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? "admin-register-password-error" : undefined
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field label="Bootstrap Key (optional)" htmlFor="admin-bootstrap-key">
                  <InputShell icon={ShieldCheck} invalid={false}>
                    <input
                      id="admin-bootstrap-key"
                      name="bootstrapKey"
                      type="text"
                      autoComplete="off"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Server bootstrap key"
                      value={form.bootstrapKey}
                      onChange={updateField("bootstrapKey")}
                      aria-describedby="admin-bootstrap-key-help"
                      disabled={loading}
                    />
                  </InputShell>
                  <p
                    id="admin-bootstrap-key-help"
                    className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground"
                  >
                    Only needed if the server requires ADMIN_BOOTSTRAP_KEY
                  </p>
                </Field>

                <SubmitButton loading={loading} idleLabel="Create Admin" loadingLabel="Creating..." />
              </form>
            )}

            {/* ===================== */}
            {/* LOGIN MODE */}
            {/* ===================== */}
            {isRegistered && (
              <form onSubmit={loginAdmin} className="space-y-5" noValidate>
                <Field label="Email" htmlFor="admin-login-email" error={fieldErrors.email}>
                  <InputShell icon={Mail} invalid={Boolean(fieldErrors.email)}>
                    <input
                      id="admin-login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="admin@dunnkayce.com"
                      value={form.email}
                      onChange={updateField("email")}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "admin-login-email-error" : undefined
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <Field
                  label="Password"
                  htmlFor="admin-login-password"
                  error={fieldErrors.password}
                >
                  <InputShell icon={Lock} invalid={Boolean(fieldErrors.password)}>
                    <input
                      id="admin-login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={updateField("password")}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? "admin-login-password-error" : undefined
                      }
                      disabled={loading}
                    />
                  </InputShell>
                </Field>

                <SubmitButton loading={loading} idleLabel="Admin Login" loadingLabel="Logging in..." />
              </form>
            )}
          </AdminPanel>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Authorized personnel only. Activity may be monitored for security and operational integrity.
          </p>
        </div>
      </AdminPanel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                       */
/* -------------------------------------------------------------------------- */

function BrandPanel({ isSetup }) {
  return (
    <div className="relative isolate flex flex-col overflow-hidden bg-forest-deep p-5 text-white sm:p-7 lg:p-10 xl:p-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(248,210,111,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(75,171,104,0.28),transparent_45%),linear-gradient(155deg,var(--color-forest),var(--color-forest-deep)_62%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-fresh/20 blur-3xl"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/95 p-1 shadow-sm sm:h-12 sm:w-12">
            <img
              src={logo}
              alt="Dunnkayce Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 sm:text-xs">
              Dunnkayce
            </p>
            <p className="text-sm font-semibold leading-tight sm:text-lg">Admin Console</p>
          </div>
        </div>

        <ThemeToggle
          compact
          className="border-white/25 bg-card ring-1 ring-gold/30 shadow-lg shadow-forest-deep/20 hover:border-gold hover:bg-gold-soft hover:text-forest-deep"
        />
      </div>

      <div className="mt-5 lg:mt-14">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/15 sm:text-xs">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Secure access
        </p>
        <h1 className="mt-3 font-display text-2xl uppercase leading-[1.08] tracking-wide sm:text-3xl lg:mt-5 lg:text-4xl xl:text-5xl">
          Manage Dunnkayce with confidence.
        </h1>
        <p className="mt-2 line-clamp-2 max-w-md text-xs leading-relaxed text-white/80 sm:text-sm lg:mt-4 lg:line-clamp-none lg:text-base">
          {isSetup
            ? "Set up the first administrator account to secure kitchen operations, orders, and campus delivery management."
            : "Sign in to access the admin dashboard, monitor operations, and keep campus service running smoothly."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 lg:mt-9 lg:gap-3">
        {FOOD_HIGHLIGHTS.slice(0, 3).map((item) => (
          <div key={item.name} className="relative">
            <FoodImage
              src={item.src}
              alt={`Illustrative food photography: ${item.name}`}
              ratio="aspect-[4/3]"
              className="rounded-xl shadow-lg shadow-forest-deep/25 ring-1 ring-white/20 lg:rounded-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-forest-deep/90 to-transparent px-2 pb-1.5 pt-6 lg:rounded-b-2xl lg:px-3 lg:pb-2.5"
            >
              <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-white sm:text-xs">
                {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-9">
        <div className="rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/15 backdrop-blur-sm sm:p-4">
          <StatusPill
            tone="gold"
            className="border-white/25 bg-white/10 text-white [&>span]:bg-gold"
          >
            Trusted controls
          </StatusPill>
          <p className="mt-2 hidden text-xs leading-relaxed text-white/80 sm:block">
            Protected access for administrative actions.
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/15 backdrop-blur-sm sm:p-4">
          <StatusPill
            tone="fresh"
            className="border-white/25 bg-white/10 text-white [&>span]:bg-fresh"
          >
            Kitchen operations
          </StatusPill>
          <p className="mt-2 hidden text-xs leading-relaxed text-white/80 sm:block">
            Keep orders, menus, and service in sync.
          </p>
        </div>
      </div>

      <div className="mt-8 hidden items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60 lg:flex">
        <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
        Swift Campus Feast
        <Sparkles className="ml-auto h-3.5 w-3.5 text-gold" aria-hidden="true" />
      </div>
    </div>
  );
}

function SubmitButton({ loading, idleLabel, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-[dk-spin_1.1s_linear_infinite] rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span role="status" aria-live="polite">
            {loadingLabel}
          </span>
        </>
      ) : (
        <>
          {idleLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-destructive" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InputShell({ icon: Icon, children, invalid = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-background px-3 shadow-xs transition-[border-color,box-shadow] duration-200",
        "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15",
        invalid ? "border-destructive/70 ring-2 ring-destructive/15" : "border-input",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {children}
    </div>
  );
}
