import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Clock3, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management — Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const BASE = "http://localhost:5000";

// Hardcoded base counts (demo padding)
const BASE_COUNTS = { Pending: 3, Preparing: 2, Ready: 1, Delivered: 12 };

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700",
  Preparing: "bg-sky-100 text-sky-700",
  Ready: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-violet-100 text-violet-700",
};

function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("adminToken");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/orders`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE}/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Real counts + hardcoded base
  const counts = ["Pending", "Preparing", "Ready", "Delivered"].map((label) => ({
    label,
    value: BASE_COUNTS[label] + orders.filter((o) => o.status === label).length,
    color: STATUS_COLORS[label],
  }));

  return (
    <AdminShell
      title="Order Management"
      description="View, track, and update student orders through Pending, Preparing, Ready, and Delivered statuses."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {counts.map((item) => (
            <div key={item.label} className="rounded-3xl border border-input bg-card p-5 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Orders list */}
        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">All orders</h2>
              <p className="mt-2 text-sm text-muted-foreground">Review student orders and update progress.</p>
            </div>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
                Loading orders...
              </div>
            )}

            {!loading && orders.length === 0 && (
              <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            )}

            {orders.map((o) => (
              <div key={o._id} className="rounded-3xl border border-input bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">#{o._id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.hostel} · Room {o.room} · {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.paymentMethod} ·{" "}
                      <span className={
                        o.paymentStatus === "Paid" ? "text-emerald-600 font-semibold" :
                        o.paymentStatus === "Rejected" ? "text-red-500" :
                        "text-amber-600"
                      }>{o.paymentStatus}</span>
                      {" · "}₦{o.total?.toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-semibold outline-none"
                  >
                    <option>Pending</option>
                    <option>Preparing</option>
                    <option>Ready</option>
                    <option>Delivered</option>
                  </select>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {o.items?.map((it, i) => (
                    <span key={i} className="rounded-full bg-background border border-input px-3 py-1">
                      {it.qty}× {it.name}{it.soupType ? ` (${it.soupType})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
