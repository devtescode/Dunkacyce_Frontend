import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useSignupMutation } from "@/lib/api";
import { store } from "@/lib/store";
import { setSessionToken, setSessionUser } from "@/lib/session";

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

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.fullName) return toast.error("Full name is required");
    if (!payload.phone) return toast.error("Phone number is required");
    if (!payload.gender) return toast.error("Please select gender");
    if (!payload.email) return toast.error("Email is required");
    if (payload.password.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      const data = await signupMutation.mutateAsync(payload);
      const token = data.token ?? data.accessToken ?? "";
      const currentUser = data.user ?? data.admin ?? null;

      if (!currentUser) {
        toast.error("Signup failed: invalid user data");
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
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,201,40,0.16),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(32,164,71,0.12),transparent_30%)]" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary">Join DUNNKAYCE</p>
          <h1 className="mt-5 max-w-xl text-5xl font-black tracking-tight text-primary">
            Campus meals,
            <span className="block text-foreground">made effortless.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Create your account to order fresh, tasty meals and get them delivered right where you are on campus.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">D</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Create account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" htmlFor="signup-name">
              <InputWrap icon={User}>
                <input id="signup-name" autoComplete="name" className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" required />
              </InputWrap>
            </Field>

            <Field label="Phone" htmlFor="signup-phone">
              <InputWrap icon={Phone}>
                <input id="signup-phone" autoComplete="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080..." required />
              </InputWrap>
            </Field>

            <Field label="Gender" htmlFor="signup-gender">
              <select id="signup-gender" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            <Field label="Email" htmlFor="signup-email">
              <InputWrap icon={Mail}>
                <input id="signup-email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
              </InputWrap>
            </Field>

            <Field label="Password" htmlFor="signup-password">
              <InputWrap icon={Lock}>
                <input id="signup-password" type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" minLength={6} required />
              </InputWrap>
            </Field>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signupMutation.isPending ? "Creating account..." : "Create account"}
              {!signupMutation.isPending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10";

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

function InputWrap({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {children}
    </div>
  );
}