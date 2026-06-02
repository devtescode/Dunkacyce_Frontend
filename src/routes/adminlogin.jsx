import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/adminlogin")({
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(null); // null = loading check

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  // 🔥 check if admin exists (safe even if network fails)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/exists");

        const data = await res.json();

        setIsRegistered(data.exists);
      } catch (err) {
        // ⚡ NETWORK FAIL SAFE: still allow login page
        toast.error("Network unstable");
        setTimeout(() => {
          setIsRegistered(true); // assume admin exists → go login mode
        }, 800);
      }
    };

    checkAdmin();
  }, []);

  // =====================
  // REGISTER ADMIN
  // =====================
  const registerAdmin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.username || !form.password) {
      return toast.error("Fill all fields");
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Registration failed");
      }

      toast.success("Admin registered 🎉");

      setIsRegistered(true); // switch to login UI
    } catch (err) {
      toast.error("Network error");
      setTimeout(() => navigate({ to: "/adminlogin" }), 800);
    } finally {
      setLoading(false);
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
      setLoading(true);

      const res = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Login failed");
      }

      toast.success("Welcome Admin 🔥");

      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("admin", JSON.stringify(data.admin));

      navigate({ to: "/admin-dashboard", replace: true });
    } catch (err) {
      toast.error("Network issue");
      setTimeout(() => {
        navigate({ to: "/adminlogin", replace: true });
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  // loading state
  if (isRegistered === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading admin system...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-accent/40 via-background to-secondary">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto bg-primary text-white flex items-center justify-center rounded-2xl text-3xl">
            A
          </div>
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            {isRegistered ? "Admin Login" : "Create Admin Account"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6">

          {/* ===================== */}
          {/* REGISTER MODE */}
          {/* ===================== */}
          {!isRegistered && (
            <form onSubmit={registerAdmin} className="space-y-4">

              <Field label="Username">
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </Field>
              <Field label="Email">
                <input
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

              <button className="w-full bg-primary text-white py-3 rounded-lg">
                {loading ? "Creating..." : "Create Admin"}
              </button>

            </form>
          )}

          {/* ===================== */}
          {/* LOGIN MODE */}
          {/* ===================== */}
          {isRegistered && (
            <form onSubmit={loginAdmin} className="space-y-4">

              <Field label="Email">
                <input
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

              <button className="w-full bg-primary text-white py-3 rounded-lg">
                {loading ? "Logging in..." : "Admin Login"}
              </button>

            </form>
          )}

        </div>
      </div>

      <style>{`
        .input {
          width:100%;
          border:1px solid var(--border);
          padding:10px;
          border-radius:8px;
        }
      `}</style>

    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}