import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { store, useStore, formatNGN } from "@/lib/store";
import { toast } from "sonner";
export const Route = createFileRoute("/admin")({
    head: () => ({ meta: [{ title: "Admin — Dunnkayce" }] }),
    component: AdminPage,
});
function AdminPage() {
    const navigate = useNavigate();
    const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
    const [tab, setTab] = useState("foods");
    useEffect(() => {
        if (!user)
            navigate({ to: "/login" });
        else if (user.role !== "admin")
            navigate({ to: "/" });
    }, [user, navigate]);
    if (!user || user.role !== "admin")
        return null;
    return (<main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage foods, orders, users and payments.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {["foods", "orders", "users", "payments"].map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>))}
      </div>

      {tab === "foods" && <FoodsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "users" && <UsersTab />}
      {tab === "payments" && <PaymentsTab />}
    </main>);
}
// ============ FOODS ============
function FoodsTab() {
    const foods = useStore((s) => s.foods);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    return (<div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-2xl">Food Management</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/> Add food</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {foods.map((f) => (<div key={f.id} className="rounded-xl border bg-card overflow-hidden">
            <img src={f.image} alt={f.name} className="aspect-[4/3] w-full object-cover"/>
            <div className="p-4">
              <div className="flex justify-between gap-2">
                <h3 className="font-semibold">{f.name}</h3>
                <span className="font-display text-primary">{formatNGN(f.price)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{f.category} · Limit {f.dailyLimit}/day</p>
              <div className="mt-3 flex gap-2">
                <select value={f.status} onChange={(e) => store.updateFood(f.id, { status: e.target.value })} className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs">
                  <option>Available</option><option>Not available</option><option>Preparing</option>
                </select>
                <button onClick={() => { setEditing(f); setShowForm(true); }} className="rounded-md border p-2 hover:bg-secondary"><Pencil className="h-3.5 w-3.5"/></button>
                <button onClick={() => { if (confirm(`Delete ${f.name}?`)) {
            store.deleteFood(f.id);
            toast.success("Deleted");
        } }} className="rounded-md border p-2 hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-3.5 w-3.5"/></button>
              </div>
            </div>
          </div>))}
      </div>

      {showForm && <FoodForm initial={editing} onClose={() => setShowForm(false)}/>}
    </div>);
}
function FoodForm({ initial, onClose }) {
    const [f, setF] = useState(initial ?? {
        name: "", image: "", price: 0, description: "", category: "Foods", status: "Available", isSwallow: false, dailyLimit: 10,
    });
    const setCat = (category) => setF({ ...f, category, dailyLimit: category === "Foods" ? 10 : 3, isSwallow: category === "Foods" ? f.isSwallow : false });
    const save = (e) => {
        e.preventDefault();
        if (!f.name || !f.image || f.price <= 0)
            return toast.error("Fill all required fields");
        if (initial) {
            store.updateFood(initial.id, f);
            toast.success("Updated");
        }
        else {
            store.addFood(f);
            toast.success("Added");
        }
        onClose();
    };
    return (<div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-2xl">{initial ? "Edit food" : "Add food"}</h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5"/></button>
        </div>
        <Field l="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}/></Field>
        <Field l="Image URL"><input className="input" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="https://..."/></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field l="Price (₦)"><input type="number" className="input" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })}/></Field>
          <Field l="Category">
            <select className="input" value={f.category} onChange={(e) => setCat(e.target.value)}>
              <option>Foods</option><option>Protein</option>
            </select>
          </Field>
        </div>
        <Field l="Description"><textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}/></Field>
        <Field l="Status">
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option>Available</option><option>Not available</option><option>Preparing</option>
          </select>
        </Field>
        {f.category === "Foods" && (<label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.isSwallow} onChange={(e) => setF({ ...f, isSwallow: e.target.checked })}/>
            This is a Swallow (customer picks soup)
          </label>)}
        <div className="rounded-md bg-accent/40 p-3 text-xs">
          <strong>Daily limit:</strong> {f.dailyLimit} per day (auto by category)
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm">Cancel</button>
          <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">{initial ? "Update" : "Create"}</button>
        </div>
        <style>{`.input { width:100%; border:1px solid var(--border); background: var(--background); border-radius:0.5rem; padding:0.5rem 0.7rem; font-size:0.875rem; outline:none; } .input:focus { border-color: var(--ring); }`}</style>
      </form>
    </div>);
}
function Field({ l, children }) {
    return (<label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{l}</span>
      {children}
    </label>);
}
// ============ ORDERS ============
function OrdersTab() {
    const orders = useStore((s) => s.orders);
    const users = useStore((s) => s.users);
    const foods = useStore((s) => s.foods);
    const [fStudent, setFStudent] = useState("");
    const [fHostel, setFHostel] = useState("");
    const [fCat, setFCat] = useState("");
    const filtered = useMemo(() => orders.filter((o) => {
        if (fStudent && o.userId !== fStudent)
            return false;
        if (fHostel && o.hostel !== fHostel)
            return false;
        if (fCat) {
            const cats = o.items.map((i) => foods.find((f) => f.id === i.foodId)?.category);
            if (!cats.includes(fCat))
                return false;
        }
        return true;
    }), [orders, fStudent, fHostel, fCat, foods]);
    const hostels = [...new Set(orders.map((o) => o.hostel))];
    return (<div>
      <h2 className="font-display text-2xl mb-4">Order Management</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="rounded-md border bg-card px-3 py-2 text-sm" value={fStudent} onChange={(e) => setFStudent(e.target.value)}>
          <option value="">All students</option>
          {users.filter((u) => u.role === "user").map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <select className="rounded-md border bg-card px-3 py-2 text-sm" value={fHostel} onChange={(e) => setFHostel(e.target.value)}>
          <option value="">All hostels</option>
          {hostels.map((h) => <option key={h}>{h}</option>)}
        </select>
        <select className="rounded-md border bg-card px-3 py-2 text-sm" value={fCat} onChange={(e) => setFCat(e.target.value)}>
          <option value="">All categories</option><option>Foods</option><option>Protein</option>
        </select>
      </div>

      {filtered.length === 0 ? (<div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No orders match.</div>) : (<div className="space-y-3">
          {filtered.map((o) => {
                const student = users.find((u) => u.id === o.userId);
                return (<div key={o.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">#{o.id.slice(-6).toUpperCase()} · {new Date(o.createdAt).toLocaleString()}</p>
                    <p className="font-semibold">{student?.fullName ?? "Unknown"} · {o.hostel} · Room {o.room}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.paymentMethod} — <span className={o.paymentStatus === "Paid" ? "text-success font-semibold" : "text-warning-foreground"}>{o.paymentStatus}</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-display text-xl text-primary">{formatNGN(o.total)}</span>
                    <select value={o.status} onChange={(e) => store.updateOrderStatus(o.id, e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
                      <option>Pending</option><option>Preparing</option><option>Ready</option><option>Delivered</option>
                    </select>
                  </div>
                </div>
                <ul className="mt-3 text-sm text-muted-foreground border-t pt-2">
                  {o.items.map((i, idx) => <li key={idx}>{i.qty}× {i.name}</li>)}
                </ul>
              </div>);
            })}
        </div>)}
    </div>);
}
// ============ USERS ============
function UsersTab() {
    const users = useStore((s) => s.users.filter((u) => u.role === "user"));
    const orders = useStore((s) => s.orders);
    return (<div>
      <h2 className="font-display text-2xl mb-4">Students</h2>
      <div className="space-y-3">
        {users.map((u) => {
            const userOrders = orders.filter((o) => o.userId === u.id);
            const spent = userOrders.filter((o) => o.paymentStatus === "Paid").reduce((s, o) => s + o.total, 0);
            return (<div key={u.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.phone} · {u.gender}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{userOrders.length} orders · {formatNGN(spent)} spent</p>
                </div>
              </div>
              {userOrders.length > 0 && (<details className="mt-3">
                  <summary className="text-sm text-primary cursor-pointer">View history</summary>
                  <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                    {userOrders.map((o) => <li key={o.id}>{new Date(o.createdAt).toLocaleDateString()} — #{o.id.slice(-6).toUpperCase()} · {formatNGN(o.total)} · {o.status} · {o.paymentStatus}</li>)}
                  </ul>
                </details>)}
            </div>);
        })}
        {users.length === 0 && <p className="text-muted-foreground">No students yet.</p>}
      </div>
    </div>);
}
// ============ PAYMENTS ============
function PaymentsTab() {
    const orders = useStore((s) => s.orders);
    const users = useStore((s) => s.users);
    const today = new Date().toDateString();
    const todayRevenue = orders.filter((o) => o.paymentStatus === "Paid" && new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.paymentMethod === "Moniepoint" && o.paymentStatus === "Pending");
    const all = orders;
    const setStatus = (id, status) => { store.updatePaymentStatus(id, status); toast.success(`Marked ${status}`); };
    return (<div>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Today revenue" value={formatNGN(todayRevenue)}/>
        <Stat label="Pending manual" value={pending.length.toString()}/>
        <Stat label="Total orders" value={orders.length.toString()}/>
      </div>

      <h2 className="font-display text-2xl mb-3">Pending Moniepoint verifications</h2>
      {pending.length === 0 ? (<p className="text-sm text-muted-foreground mb-6">Nothing awaiting verification.</p>) : (<div className="space-y-2 mb-6">
          {pending.map((o) => {
                const u = users.find((x) => x.id === o.userId);
                return (<div key={o.id} className="rounded-lg border bg-card p-3 flex flex-wrap justify-between gap-3 items-center">
                <div>
                  <p className="font-semibold text-sm">{u?.fullName} · #{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{formatNGN(o.total)} · {new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStatus(o.id, "Paid")} className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground">Approve</button>
                  <button onClick={() => setStatus(o.id, "Rejected")} className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">Reject</button>
                </div>
              </div>);
            })}
        </div>)}

      <h2 className="font-display text-2xl mb-3">All payments</h2>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Student</th><th className="text-left p-3">Method</th><th className="text-left p-3">Status</th><th className="text-right p-3">Amount</th></tr>
          </thead>
          <tbody>
            {all.map((o) => {
            const u = users.find((x) => x.id === o.userId);
            return (<tr key={o.id} className="border-t">
                  <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{u?.fullName ?? "—"}</td>
                  <td className="p-3">{o.paymentMethod}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.paymentStatus === "Paid" ? "bg-success/15 text-success" : o.paymentStatus === "Pending" ? "bg-warning/20 text-warning-foreground" : "bg-destructive/15 text-destructive"}`}>{o.paymentStatus}</span></td>
                  <td className="p-3 text-right font-semibold">{formatNGN(o.total)}</td>
                </tr>);
        })}
            {all.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);
}
function Stat({ label, value }) {
    return (<div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
    </div>);
}
