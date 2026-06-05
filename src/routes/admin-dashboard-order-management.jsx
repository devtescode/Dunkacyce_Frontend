import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { RefreshCcw, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management — Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const BASE = "https://dunkacyce-backend.onrender.com";

function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("adminToken");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/getorders`);
      const data = await res.json();

      // 🔥 ONLY PAID ORDERS
      const paidOrders = (data.orders ?? []).filter(
        (o) => o.paymentStatus === "Paid"
      );

      setOrders(paidOrders);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );

      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
  <AdminShell
  title="Paid Orders"
  description="Only successfully paid orders appear here"
>
  <div className="space-y-8">

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Successful Payments
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Track all completed Paystack transactions
        </p>
      </div>

      <button
        onClick={fetchOrders}
        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-white hover:bg-gray-800 transition shadow-sm"
      >
        <RefreshCcw className="h-4 w-4" />
        Refresh
      </button>
    </div>

    {/* LOADING */}
    {loading && (
      <div className="text-center text-gray-500 py-16">
        Loading successful payments...
      </div>
    )}

    {/* EMPTY STATE */}
    {!loading && orders.length === 0 && (
      <div className="text-center py-20 border rounded-2xl bg-gray-50">
        <CheckCircle className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 font-medium">
          No successful payments yet
        </p>
      </div>
    )}

    {/* ORDERS GRID */}
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((o) => (
        <div
          key={o._id}
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg transition"
        >

          {/* TOP BADGE */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Paid Successfully
            </span>

            <span className="text-xs text-gray-400">
              {new Date(o.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* USER INFO */}
          <div className="mb-4">
            <p className="font-semibold text-gray-900">
              #{o._id.slice(-6).toUpperCase()}
            </p>

            <p className="text-sm font-medium text-gray-700 mt-1">
              👤 {o.userId?.fullName || "Unknown User"}
            </p>

            <p className="text-xs text-gray-500">
              {o.userId?.email}
            </p>
            <p className="text-xs text-gray-500">
              {o.userId?.phone}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              📍 {o.hostel} · Room {o.room}
            </p>
          </div>

          {/* TOTAL */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-lg font-bold text-gray-900">
              ₦{o.total?.toLocaleString()}
            </p>
          </div>

          {/* ITEMS */}
          <div className="space-y-2 border-t pt-3">
            {o.items.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>
                  {item.qty}× {item.name}
                </span>
                <span className="font-medium">
                  ₦{item.qty * item.price}
                </span>
              </div>
            ))}

            {o.items.length > 3 && (
              <p className="text-xs text-gray-400">
                +{o.items.length - 3} more items
              </p>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <p className="text-xs text-gray-500">
              Paid via <span className="font-medium">{o.paymentMethod}</span>
            </p>

            <select
              value={o.status}
              onChange={(e) => updateStatus(o._id, e.target.value)}
              className="text-xs border rounded-lg px-2 py-1 bg-gray-50 hover:bg-white"
            >
              <option>Preparing</option>
              <option>Ready</option>
              <option>Delivered</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  </div>
</AdminShell>
  );
}