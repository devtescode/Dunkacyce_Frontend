import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-dashboard-food-management")({
  head: () => ({ meta: [{ title: "Food Management — Dunnkayce Admin" }] }),
  component: FoodManagementPage,
});

const BASE = "https://dunkacyce-backend.onrender.com";

function FoodManagementPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const token = sessionStorage.getItem("adminToken");

  const fetchFoods = async () => {
    try {
      const res = await fetch(`${BASE}/food`);
      const data = await res.json();
      setFoods(data.foods ?? []);
    } catch {
      toast.error("Failed to load foods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const deleteFood = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      const res = await fetch(`${BASE}/food/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      setFoods((prev) => prev.filter((f) => f._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (food) => { setEditing(food); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const onSaved = (food, isEdit) => {
    if (isEdit) {
      setFoods((prev) => prev.map((f) => (f._id === food._id ? food : f)));
    } else {
      setFoods((prev) => [food, ...prev]);
    }
    closeForm();
  };

  const statusColor = (status) => {
    if (status === "Available") return "bg-emerald-100 text-emerald-700";
    if (status === "Preparing") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-600";
  };

  return (
    <AdminShell
      title="Food Management"
      description="Add, edit, and delete food items with images, prices, and availability."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Foods</p>
            <h2 className="text-2xl font-semibold">Manage the menu</h2>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" /> Add food item
          </button>
        </div>

        {/* Food list */}
        <div className="space-y-4">
          {loading && (
            <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
              Loading foods...
            </div>
          )}

          {!loading && foods.length === 0 && (
            <div className="rounded-3xl border border-input bg-card p-8 text-center text-sm text-muted-foreground">
              No food items yet. Add one above.
            </div>
          )}

          {foods.map((food) => (
            <div key={food._id} className="rounded-3xl border border-input bg-background p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Image */}
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  className="h-16 w-16 rounded-2xl object-cover border border-input flex-shrink-0"
                  onError={(e) => { e.target.src = "https://placehold.co/64x64?text=Food"; }}
                />
                {/* Info */}
                <div className="flex-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.category} {food.isSwallow ? "· Swallow" : ""} · Limit {food.dailyLimit}/day
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(food.status)}`}>
                      {food.status}
                    </span>
                    <span className="font-semibold text-sm">₦{food.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(food)}
                  className="inline-flex items-center gap-2 rounded-full border border-input px-3 py-2 text-sm hover:bg-secondary transition"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => deleteFood(food._id, food.name)}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <FoodForm
          initial={editing}
          token={token}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </AdminShell>
  );
}

function FoodForm({ initial, token, onClose, onSaved }) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    price: initial?.price ?? "",
    category: initial?.category ?? "Foods",
    imageUrl: initial?.imageUrl ?? "",
    status: initial?.status ?? "Available",
    isSwallow: initial?.isSwallow ?? false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(initial?.imageUrl ?? "");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const setCategory = (cat) => {
    setForm((p) => ({
      ...p,
      category: cat,
      isSwallow: cat === "Foods" ? p.isSwallow : false,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || (!form.imageUrl && !imageFile)) {
      return toast.error("Name, price and image file are required");
    }

    try {
      setLoading(true);
      const url = isEdit ? `${BASE}/food/${initial._id}` : `${BASE}/food`;
      const method = isEdit ? "PUT" : "POST";
      let body;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("name", form.name);
        formData.append("price", Number(form.price));
        formData.append("category", form.category);
        formData.append("status", form.status);
        formData.append("isSwallow", form.isSwallow ? "true" : "false");
        formData.append("dailyLimit", form.category === "Foods" ? "10" : "3");
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          ...form,
          price: Number(form.price),
          dailyLimit: form.category === "Foods" ? 10 : 3,
        });
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Failed");

      toast.success(isEdit ? "Food updated" : "Food added");
      onSaved(data.food, isEdit);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-input bg-card p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{isEdit ? "Edit food" : "Add food item"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</span>
            <input
              className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/70 transition"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Jollof Rice"
            />
          </label>

          {/* Price */}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price (₦)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/70 transition"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. 1500"
            />
          </label>

          {/* Category */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</span>
            <div className="mt-2 flex gap-2">
              {["Foods", "Protein"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-1 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                    form.category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input bg-background hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL + preview */}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Image URL</span>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/70 transition"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                if (file) {
                  setPreview(URL.createObjectURL(file));
                  set("imageUrl", file.name);
                } else {
                  setPreview(initial?.imageUrl ?? "");
                  set("imageUrl", initial?.imageUrl ?? "");
                }
              }}
            />
          </label>

          {preview && (
            <div className="rounded-2xl border border-input overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover"
                onError={(e) => { e.target.src = "https://placehold.co/400x160?text=Invalid+URL"; }}
              />
            </div>
          )}

          {/* Status */}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span>
            <select
              className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option>Available</option>
              <option>Not available</option>
              <option>Preparing</option>
            </select>
          </label>

          {/* Swallow toggle — only for Foods */}
          {form.category === "Foods" && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set("isSwallow", !form.isSwallow)}
                className={`w-10 h-6 rounded-full transition flex items-center px-1 ${form.isSwallow ? "bg-primary" : "bg-input"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isSwallow ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm">This is a Swallow (customer picks soup)</span>
            </label>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-input py-3 text-sm font-semibold hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Add food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
