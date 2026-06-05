import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Dunnkayce" }] }),
  component: AdminDashboardPage,
});

const BASE = "https://dunkacyce-backend.onrender.com";

function AdminDashboardPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalOrders: 0,
    weeklyRevenue: 0,
  });

  // -------------------------
  // AUTH CHECK
  // -------------------------
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    const stored = sessionStorage.getItem("admin");

    if (!token || !stored) {
      navigate({ to: "/adminlogin", replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setAdmin(parsed);
    } catch {
      navigate({ to: "/adminlogin", replace: true });
    }
  }, [navigate]);

  // -------------------------
  // FETCH DASHBOARD STATS
  // -------------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE}/admin/dashboard-stats`);
        const data = await res.json();

        setStats({
          totalStudents: data.totalStudents || 0,
          totalOrders: data.totalOrders || 0,
          weeklyRevenue: data.weeklyRevenue || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, []);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Checking admin session…
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                Welcome back, {admin.username ?? admin.email ?? "Admin"}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                All core admin flows are available from the sidebar navigation.
              </p>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Students",
              value: stats.totalStudents,
              subtitle: "Registered campus users",
            },
            {
              title: "Orders",
              value: stats.totalOrders,
              subtitle: "Total orders placed",
            },
            {
              title: "Revenue",
              value: `₦${stats.weeklyRevenue.toLocaleString()}`,
              subtitle: "This week earnings",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-input bg-background p-6 shadow-sm"
            >
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
                {item.title}
              </p>

              <p className="mt-4 text-3xl font-semibold text-foreground">
                {item.value}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* QUICK LINKS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Food Management", path: "/admin-dashboard-food-management" },
            { label: "Order Management", path: "/admin-dashboard-order-management" },
            { label: "Student cart", path: "/admin-dashboard-student-cart" },
            { label: "System Settings", path: "/admin-dashboard-system-settings" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="group rounded-3xl border border-input bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Open the admin page for this feature.
                  </p>
                </div>

                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </AdminShell>
  );
}