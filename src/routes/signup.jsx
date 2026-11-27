import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronDown, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useSignupMutation } from "@/lib/api";
import { store } from "@/lib/store";
import { setSessionToken, setSessionUser } from "@/lib/session";
import {
  AuthField,
  AuthInput,
  AuthLayout,
  AuthSubmit,
  PasswordInput,
} from "@/components/auth/AuthUI";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — DUNNKAYCE" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const clearError = (field) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  const fail = (field, message) => {
    setErrors({ [field]: message });
    toast.error(message);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.fullName) return fail("fullName", "Full name is required");
    if (!payload.phone) return fail("phone", "Phone number is required");
    if (!payload.gender) return fail("gender", "Please select gender");
    if (!payload.email) return fail("email", "Email is required");
    if (payload.password.length < 6)
      return fail("password", "Password must be at least 6 characters");

    setErrors({});
    setFormError("");

    try {
      const data = await signupMutation.mutateAsync(payload);
      const token = data.token ?? data.accessToken ?? "";
      const currentUser = data.user ?? data.admin ?? null;

      if (!currentUser) {
        toast.error("Signup failed: invalid user data");
        setFormError("Signup failed: invalid user data");
        return;
      }

      const normalizedUser = { ...currentUser, id: currentUser.id ?? currentUser._id };
      store.syncUser(normalizedUser);
      setSessionUser(normalizedUser);
      if (token) {
        store.setAuthToken(token);
        setSessionToken(token);
      }

      toast.success("Account created successfully!");
      navigate({ to: "/user-dashboard", replace: true });
    } catch (error) {
      const message = error?.payload?.message || error?.message || "Signup failed";
      toast.error(error?.status || error?.payload ? message : "Network error. Please try again.");
      setFormError(error?.status || error?.payload ? message : "Network error. Please try again.");
    }
  };

  return (
    <AuthLayout
      mode="signup"
      title="Create your account"
      description="Join DUNNKAYCE for campus meal delivery — fresh food, easy ordering, right where you are."
      footer={
        <Link
          to="/login"
          className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-primary/25 bg-secondary px-4 py-3 text-center text-[13px] font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 motion-reduce:transition-none sm:text-sm"
        >
          Already have an account? Sign in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      <form noValidate onSubmit={onSubmit} aria-busy={signupMutation.isPending} className="space-y-5">
        <fieldset disabled={signupMutation.isPending} className="min-w-0 space-y-5 border-0 p-0">
          <legend className="sr-only">Create account details</legend>

          <AuthField
            id="signup-name"
            label="Full name"
            icon={UserRound}
            error={errors.fullName}
          >
            <AuthInput
              id="signup-name"
              name="fullName"
              autoComplete="name"
              required
              placeholder="Your full name"
              value={form.fullName}
              onChange={(e) => {
                clearError("fullName");
                setForm({ ...form, fullName: e.target.value });
              }}
            />
          </AuthField>

          <AuthField
            id="signup-phone"
            label="Phone"
            icon={Phone}
            error={errors.phone}
          >
            <AuthInput
              id="signup-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="080..."
              value={form.phone}
              onChange={(e) => {
                clearError("phone");
                setForm({ ...form, phone: e.target.value });
              }}
            />
          </AuthField>

          <AuthField
            id="signup-gender"
            label="Gender"
            icon={UserRound}
            error={errors.gender}
            trailing={<ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          >
            <select
              id="signup-gender"
              name="gender"
              required
              className="w-full min-w-0 flex-1 appearance-none bg-transparent py-3.5 pl-14 pr-12 text-sm text-foreground focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              value={form.gender}
              onChange={(e) => {
                clearError("gender");
                setForm({ ...form, gender: e.target.value });
              }}
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </AuthField>

          <AuthField id="signup-email" label="Email" icon={Mail} error={errors.email}>
            <AuthInput
              id="signup-email"
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
            id="signup-password"
            name="password"
            label="Password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            hint="Minimum 6 characters."
            error={errors.password}
            disabled={signupMutation.isPending}
            value={form.password}
            onChange={(e) => {
              clearError("password");
              setForm({ ...form, password: e.target.value });
            }}
          />

          <AuthSubmit
            isPending={signupMutation.isPending}
            idleLabel="Create account"
            pendingLabel="Creating account..."
          />
        </fieldset>
        <p role="alert" className="sr-only">
          {formError}
        </p>
      </form>
    </AuthLayout>
  );
}
