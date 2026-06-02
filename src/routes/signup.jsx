import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
    head: () => ({ meta: [{ title: "Sign up — Dunnkayce" }] }),
    component: SignupPage,
});

function SignupPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        gender: "",
    });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName) return toast.error("Full name is required");
        if (!form.phone) return toast.error("Phone number is required");
        if (!form.gender) return toast.error("Please select gender");
        if (!form.email) return toast.error("Email is required");
        if (!form.password) return toast.error("Password is required");

        try {
            setLoading(true);

            const res = await fetch("http://localhost:5000/dunnkayce/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                return toast.error(data.message || "Signup failed");
            }

            toast.success("Account created successfully 🎉");

            // store token (real-world auth)
            sessionStorage.setItem("token", data.token);

            navigate({ to: "/" });
        } catch (err) {
            toast.error("Network error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-accent/40 via-background to-secondary">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-3xl mb-3">
                        D
                    </div>
                    <h1 className="font-display text-4xl">Dunnkayce</h1>
                    <p className="text-sm text-muted-foreground">
                        Campus food. Delivered hot.
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="text-sm text-muted-foreground mb-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary underline">
                            Sign in
                        </Link>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <Field label="Full name">
                            <input
                                className="input"
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm({ ...form, fullName: e.target.value })
                                }
                            />
                        </Field>

                        <Field label="Phone">
                            <input
                                className="input"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </Field>

                        <Field label="Gender">
                            <select
                                className="input"
                                value={form.gender}
                                onChange={(e) =>
                                    setForm({ ...form, gender: e.target.value })
                                }
                            >
                                <option value="" disabled>
                                    Select Gender
                                </option>

                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                {/* <option value="Other">Other</option> */}
                            </select>
                        </Field>

                        <Field label="Email">
                            <input
                                type="email"
                                className="input"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                            />
                        </Field>

                        <Field label="Password">
                            <input
                                type="password"
                                className="input"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                            />
                        </Field>

                        <button
                            disabled={loading}
                            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
        .input {
          width:100%;
          border:1px solid var(--border);
          background: var(--background);
          border-radius:0.5rem;
          padding:0.55rem 0.75rem;
          font-size:0.875rem;
          outline:none;
        }
        .input:focus {
          border-color: var(--ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent);
        }
      `}</style>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}