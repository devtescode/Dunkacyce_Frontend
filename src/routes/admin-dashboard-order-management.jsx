import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { RefreshCcw, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-dashboard-order-management")({
  head: () => ({ meta: [{ title: "Order Management — Dunnkayce Admin" }] }),
  component: OrderManagementPage,
});

const BASE = "http://localhost:5000";

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
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Successful Payments</h2>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-500 py-10">
            Loading orders...
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No successful payments yet
          </div>
        )}

        {/* Orders */}
        {orders.map((o) => (
          <div
            key={o._id}
            className="border rounded-xl p-4 bg-white shadow-sm"
          >
            {/* PAYMENT BADGE */}
            <div className="flex items-center gap-2 text-green-600 mb-3">
              <CheckCircle className="w-4 h-4" />
              Paid Successfully
            </div>

            {/* HEADER */}
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">
                  #{o._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-sm text-gray-500">
                  {o.hostel} · Room {o.room}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>

              <p className="font-bold text-lg">₦{o.total}</p>
            </div>

            {/* ITEMS */}
            <div className="mt-4 space-y-1">
              {o.items.map((item, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>
                    {item.qty}× {item.name}
                  </span>
                  <span>₦{item.qty * item.price}</span>
                </div>
              ))}
            </div>

            {/* STATUS */}
            {/* <div className="mt-3 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Paid via {o.paymentMethod}
              </p>

              <select
                value={o.status}
                onChange={(e) => updateStatus(o._id, e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              >
                <option>Preparing</option>
                <option>Ready</option>
                <option>Delivered</option>
              </select>
            </div> */}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}