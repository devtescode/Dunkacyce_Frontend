import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  useAdminExistsQuery,
  useAdminLoginMutation,
  useAdminRegisterMutation,
} from "@/lib/api";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import logo from "../assest/elizade_university_ilara_mokin_profile.jpg"

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
      <div className="flex justify-center py-10">
        <DunnkayceLoader
          variant="compact"
          label="Loading admin system"
          caption="Unlocking the kitchen controls."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-accent/40 via-background to-secondary">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="h-10 w-20 mx-auto bg-primary text-white flex items-center justify-center rounded-sm text-3xl">
             <img src={logo} alt="Dunnkayce Logo" className="rounded-sm" />
          </div>
          <h1 className="text-4xl font-bold mt-7">Admin Panel</h1>
          {/* <p className="text-sm text-muted-foreground">
            {isRegistered ? "Admin Login" : "Create Admin Account"}
          </p> */}
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