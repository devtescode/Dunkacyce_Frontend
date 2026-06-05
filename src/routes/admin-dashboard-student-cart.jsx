import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { RefreshCcw, ShoppingCart, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/store";

export const Route = createFileRoute("/admin-dashboard-student-cart")({
  component: StudentCartPage,
});

const BASE = "https://dunkacyce-backend.onrender.com";

function StudentCartPage() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/carts`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCarts(data.carts ?? []);
    } catch {
      toast.error("Failed to load student carts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  // Summary stats
  const totalStudents = carts.length;
  const totalItems = carts.reduce((sum, c) => sum + c.items.length, 0);
  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  return (
    <AdminShell
      title="Order Management"
      description="Live view of what students currently have in their carts, grouped by student."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Students with items" value={totalStudents} colorClass="text-sky-600" />
          <StatCard label="Total items in carts" value={totalItems} colorClass="text-amber-600" />
          <StatCard label="Total cart value" value={formatNGN(totalValue)} colorClass="text-emerald-600" />
        </div>

        {/* Cart list */}
        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">All student carts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each card shows one student's full cart. Items are grouped together.
              </p>
            </div>
            <button
              onClick={fetchCarts}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
                Loading carts...
              </div>
            )}

            {!loading && carts.length === 0 && (
              <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No students have items in their cart yet.
              </div>
            )}

            {carts.map((cart) => (
              <StudentCartCard key={cart.userId} cart={cart} />
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StudentCartCard({ cart }) {
  return (
    <div className="rounded-3xl border border-input bg-card p-5">
      {/* Student header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{cart.studentName}</p>
            {cart.studentEmail && (
              <p className="text-xs text-muted-foreground">{cart.studentEmail}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(cart.createdAt).toLocaleString()}
          </p>
          <p className="font-display text-lg text-primary">{formatNGN(cart.total)}</p>
        </div>
      </div>

      {/* Cart items */}
      <div className="flex flex-wrap gap-2">
        {cart.items.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-8 w-8 rounded-lg object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div>
              <p className="text-sm font-semibold leading-tight">
                {item.quantity}× {item.name}
              </p>
              {item.soup && (
                <p className="text-[11px] text-muted-foreground">Soup: {item.soup}</p>
              )}
              <p className="text-[11px] text-primary">{formatNGN(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className="rounded-3xl border border-input bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-4 text-3xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
