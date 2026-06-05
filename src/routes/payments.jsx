import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/session";
import { formatNGN } from "@/lib/store";

export const Route = createFileRoute("/payments")({
    head: () => ({ meta: [{ title: "Payment History — Dunnkayce" }] }),
    component: PaymentsPage,
});

const BASE = "http://localhost:5000";

function PaymentsPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => getSessionUser());
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // ----------------------------
    // AUTH CHECK (FIXED)
    // ----------------------------
    useEffect(() => {
        const sessionUser = getSessionUser();

        if (!sessionUser) {
            navigate({ to: "/login" });
            return;
        }

        setUser(sessionUser);
    }, [navigate]);

    // ----------------------------
    // FETCH RECEIPTS
    // ----------------------------
    useEffect(() => {
        if (!user?.id) return;

        const fetchPayments = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `${BASE}/orders/user/${user.id}/receipts`
                );

                const data = await res.json();

                console.log("PAYMENT HISTORY:", data);

                setOrders(data.orders || []);
            } catch (err) {
                console.error("FETCH ERROR:", err);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user?.id]);

    if (!user) return null;

    // ----------------------------
    // STATUS COLORS
    // ----------------------------
    const color = (status) => {
        if (status === "Paid") return "bg-green-100 text-green-700";
        if (status === "Pending") return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    // ----------------------------
    // UI
    // ----------------------------
    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
                Payment History
            </h1>

            {/* LOADING */}
            {loading && (
                <div className="text-center py-10 text-gray-500">
                    Loading payments...
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && orders.length === 0 && (
                <div className="text-center py-10 text-gray-500 border rounded-xl bg-white">
                    No successful payments yet.
                </div>
            )}

            {/* LIST */}
            <div className="space-y-3">
                {orders.map((o) => (
                    <div
                        key={o._id}
                        onClick={() => setSelectedOrder(o)}
                        className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                    >
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

                            <p className="font-bold text-green-600">
                                {formatNGN(o.total)}
                            </p>
                        </div>

                        {/* STATUS */}
                        <div className="mt-2 flex justify-between items-center">
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${color(
                                    o.paymentStatus
                                )}`}
                            >
                                {o.paymentStatus}
                            </span>

                            <span className="text-xs text-gray-500">
                                {o.paymentMethod}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ----------------------------
          RECEIPT MODAL (OPAY STYLE READY)
      ---------------------------- */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 relative overflow-hidden">

                        {/* WATERMARK */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-5xl font-black text-gray-100 rotate-[-25deg]">
                                DUNNKAYCE
                            </p>
                        </div>

                        {/* CLOSE */}
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-black"
                        >
                            ✕
                        </button>

                        {/* TITLE */}
                        <div className="text-center mb-6">
                            <p className="text-green-600 font-bold">
                                ✓ PAYMENT SUCCESSFUL
                            </p>
                            <p className="text-xs text-gray-400">
                                Transaction Receipt
                            </p>
                        </div>

                        {/* DETAILS */}
                        {/* DETAILS */}
                        <div className="space-y-3 text-sm relative z-10">

                            <div className="flex justify-between">
                                <span>Order ID</span>
                                <span className="font-mono">
                                    #{selectedOrder._id.slice(-6).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Date</span>
                                <span>
                                    {new Date(selectedOrder.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Payment Method</span>
                                <span>{selectedOrder.paymentMethod}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className="font-semibold text-green-600">
                                    {selectedOrder.paymentStatus}
                                </span>
                            </div>

                            <hr />

                            {/* 🧾 ITEMS SECTION (NEW) */}
                            <div className="space-y-2">
                                <p className="font-semibold text-xs text-gray-500">
                                    ITEMS PURCHASED
                                </p>

                                {selectedOrder.items?.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between text-sm border-b pb-1"
                                    >
                                        <span>
                                            {item.qty}× {item.name}
                                            {item.soupType ? ` (${item.soupType})` : ""}
                                        </span>

                                        <span>
                                            {formatNGN(item.price * item.qty)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            {/* TOTAL */}
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatNGN(selectedOrder.total)}</span>
                            </div>
                        </div>
                        {/* CLOSE BUTTON */}
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="mt-6 px-4 bg-black text-white py-2 rounded-lg relative z-10"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}