import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore, formatNGN } from "@/lib/store";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payment History — Dunnkayce" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
  const orders = useStore((s) => (user ? s.orders.filter((o) => o.userId === user.id) : []));
  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  if (!user) return null;

  const color = (s: string) => s === "Paid" ? "bg-success/15 text-success" : s === "Pending" ? "bg-warning/20 text-warning-foreground" : "bg-destructive/15 text-destructive";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl mb-6">Payment History</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No payments yet.</div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Order</th><th className="text-left p-3">Method</th><th className="text-left p-3">Status</th><th className="text-right p-3">Amount</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-mono text-xs">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="p-3">{o.paymentMethod}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                  <td className="p-3 text-right font-semibold">{formatNGN(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
