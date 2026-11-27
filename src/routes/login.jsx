import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";
import { setSessionToken, setSessionUser } from "@/lib/session";
import { ApiError, useLoginMutation } from "@/lib/api";
import {
  AuthField,
  AuthInput,
  AuthLayout,
  AuthSubmit,
  PasswordInput,
} from "@/components/auth/AuthUI";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — DUNNKAYCE" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const clearError = (field) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setErrors({
        ...(email ? {} : { email: "Please fill in all fields" }),
        ...(password ? {} : { password: "Please fill in all fields" }),
      });
      toast.error("Please fill in all fields");
      return;
    }

    setErrors({});
    setFormError("");

    try {
      const data = await loginMutation.mutateAsync({ email, password });
      const token = data.token ?? data.accessToken ?? "";
      const currentUser = data.user ?? data.admin ?? null;

      if (!currentUser) {
        toast.error("Login failed: invalid user data");
        setFormError("Login failed: invalid user data");
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
        setFormError(err.payload?.message || err.message || "Login failed");
        return;
      }
      toast.error("Network error. Please try again.");
      setFormError("Network error. Please try again.");
    }
  };

  return (
    <AuthLayout
      mode="login"
      title="Welcome back"
      description="Sign in to reorder your favourite campus meals, track your cart, and get fresh food delivered fast."
      footer={
        <div>
          <p>New to DUNNKAYCE? Let’s get you set up.</p>
          <Link
            to="/signup"
            className="mt-3 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-primary/25 bg-secondary px-4 py-3 text-center text-[13px] font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 motion-reduce:transition-none sm:text-sm"
          >
            Create an account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <form noValidate onSubmit={onSubmit} aria-busy={loginMutation.isPending} className="space-y-5">
        <fieldset disabled={loginMutation.isPending} className="min-w-0 space-y-5 border-0 p-0">
          <legend className="sr-only">Sign in details</legend>

          <AuthField
            id="login-email"
            label="Email"
            icon={Mail}
            error={errors.email}
            hint="Use the email address linked to your account."
          >
            <AuthInput
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => {
                clearError("email");
                setForm({ ...form, email: e.target.value });
              }}
            />
          </AuthField>

          <PasswordInput
            id="login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            hint="Forgot your password? Contact campus support."
            error={errors.password}
            disabled={loginMutation.isPending}
            value={form.password}
            onChange={(e) => {
              clearError("password");
              setForm({ ...form, password: e.target.value });
            }}
          />

          <AuthSubmit
            isPending={loginMutation.isPending}
            idleLabel="Sign in"
            pendingLabel="Signing in..."
          />
        </fieldset>
        <p role="alert" className="sr-only">
          {formError}
        </p>
      </form>
    </AuthLayout>
  );
}
