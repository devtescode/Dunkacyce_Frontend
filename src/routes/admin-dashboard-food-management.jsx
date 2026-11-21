import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  CheckCircle2,
  CircleSlash2,
  Filter,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useFoodsQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} from "@/lib/api";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-food-management")({
  head: () => ({ meta: [{ title: "Food Management – Dunnkayce Admin" }] }),
  component: FoodManagementPage,
});

function FoodManagementPage() {
  const { data, isPending, isError, refetch } = useFoodsQuery();
  const foods = data ?? [];
  const loading = isPending;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const deleteMutation = useDeleteFoodMutation();

  const deleteFood = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (food) => { setEditing(food); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const onSaved = () => {
    closeForm();
  };

  const stats = useMemo(() => {
    const total = foods.length;
    const available = foods.filter((f) => f.status === "Available").length;
    const preparing = foods.filter((f) => f.status === "Preparing").length;
    const unavailable = foods.filter((f) => f.status === "Not available").length;
    return { total, available, preparing, unavailable };
  }, [foods]);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesSearch =
        !q ||
        food.name?.toLowerCase().includes(q) ||
        food.category?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || food.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || food.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [foods, search, categoryFilter, statusFilter]);

  const statusTone = (status) => {
    if (status === "Available") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (status === "Preparing") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const statusDot = (status) => {
    if (status === "Available") return "bg-emerald-500";
    if (status === "Preparing") return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <AdminShell
      eyebrow="Menu"
      title="Food Management"
      description="Curate your campus menu with polished food listings, clear availability, and fast editing controls."
      actions={
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
          Add food item
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Menu statistics">
          <StatCard
            icon={UtensilsCrossed}
            label="Total items"
            value={stats.total}
            hint="All menu entries"
            tone="bg-primary/10 text-primary"
          />
          <StatCard
            icon={CheckCircle2}
            label="Available"
            value={stats.available}
            hint="Ready to order"
            tone="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            icon={Filter}
            label="Preparing"
            value={stats.preparing}
            hint="Temporarily in prep"
            tone="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={CircleSlash2}
            label="Unavailable"
            value={stats.unavailable}
            hint="Hidden from ordering"
            tone="bg-rose-100 text-rose-700"
          />
        </section>

        {/* Controls + list */}
        <section className="rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
          <div className="border-b border-border/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Menu catalog</h2>
                <p className="text-sm text-muted-foreground">
                  Search, filter, and manage every dish from one place.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block sm:w-72">
                  <span className="sr-only">Search foods</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <div className="flex gap-2">
                  <label className="block flex-1 sm:flex-none">
                    <span className="sr-only">Filter by category</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 sm:w-36"
                    >
                      <option value="All">All categories</option>
                      <option value="Foods">Foods</option>
                      <option value="Protein">Protein</option>
                    </select>
                  </label>
                  <label className="block flex-1 sm:flex-none">
                    <span className="sr-only">Filter by status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 sm:w-40"
                    >
                      <option value="All">All statuses</option>
                      <option value="Available">Available</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Not available">Not available</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading && (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8">
                <DunnkayceLoader
                  variant="compact"
                  label="Loading the menu"
                  caption="Plating up every dish."
                  className="w-full max-w-md justify-center"
                />
              </div>
            )}

            {!loading && isError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-base font-semibold text-foreground">Could not load menu items</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Something went wrong while fetching the food catalog.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !isError && foods.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UtensilsCrossed className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No food items yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start building your menu by adding your first dish.
                </p>
                <button
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add food item
                </button>
              </div>
            )}

            {!loading && !isError && foods.length > 0 && filteredFoods.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No matching items</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filters to find what you need.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("All");
                    setStatusFilter("All");
                  }}
                  className="mt-5 inline-flex items-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  Clear filters
                </button>
              </div>
            )}

            {!loading && !isError && filteredFoods.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredFoods.map((food) => (
                  <article
                    key={food._id}
                    className="group flex flex-col rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted">
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/96x96?text=Food";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-foreground">{food.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">
                                {food.category}
                              </span>
                              {food.isSwallow ? (
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                                  Swallow
                                </span>
                              ) : null}
                              <span>Limit {food.dailyLimit}/day</span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                              statusTone(food.status)
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(food.status))} />
                            {food.status}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold text-foreground">
                              ₦{Number(food.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
                      <button
                        onClick={() => openEdit(food)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFood(food._id, food.name)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <FoodForm
          initial={editing}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FoodForm({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const createMutation = useCreateFoodMutation();
  const updateMutation = useUpdateFoodMutation();

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
      let payload;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("name", form.name);
        formData.append("price", Number(form.price));
        formData.append("category", form.category);
        formData.append("status", form.status);
        formData.append("isSwallow", form.isSwallow ? "true" : "false");
        formData.append("dailyLimit", form.category === "Foods" ? "10" : "3");
        payload = formData;
      } else {
        payload = {
          ...form,
          price: Number(form.price),
          dailyLimit: form.category === "Foods" ? 10 : 3,
        };
      }

      const data = isEdit
        ? await updateMutation.mutateAsync({ id: initial._id, payload })
        : await createMutation.mutateAsync(payload);

      toast.success(isEdit ? "Food updated" : "Food added");
      onSaved(data.food, isEdit);
    } catch (error) {
      if (error?.payload) {
        toast.error(error?.payload?.message || "Failed");
      } else {
        toast.error("Network error");
      }
    } finally {
      setLoading(false);
    }
  };

  const dailyLimitHint = form.category === "Foods" ? 10 : 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-form-title"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
              {isEdit ? "Update item" : "New item"}
            </p>
            <h3 id="food-form-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {isEdit ? "Edit food" : "Add food item"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set menu details, pricing, availability, and an appetizing photo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-transparent p-2 text-muted-foreground transition hover:border-border hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Food name</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Jollof Rice"
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Price (₦)</span>
                <input
                  type="number"
                  min="0"
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="e.g. 1500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Status</span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option>Available</option>
                  <option>Not available</option>
                  <option>Preparing</option>
                </select>
              </label>
            </div>

            <div>
              <span className="text-sm font-medium text-foreground">Category</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["Foods", "Protein"].map((cat) => {
                  const active = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-input bg-background text-foreground hover:bg-secondary"
                      )}
                      aria-pressed={active}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Daily limit is set automatically: {dailyLimitHint} per day for {form.category.toLowerCase()}.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Food image / photo</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-3 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                  <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/15"
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
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isEdit
                    ? "Upload a new photo to replace the current one, or leave empty to keep it."
                    : "Upload a clear photo of the dish. This is required for new items."}
                </p>
              </label>

              {preview && (
                <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-background">
                  <img
                    src={preview}
                    alt="Food preview"
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/400x160?text=Invalid+URL";
                    }}
                  />
                </div>
              )}
            </div>

            {form.category === "Foods" && (
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Swallow item</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enable this if customers should pick a soup with this food.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isSwallow}
                    aria-label="This is a swallow"
                    onClick={() => set("isSwallow", !form.isSwallow)}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      form.isSwallow ? "border-primary bg-primary" : "border-input bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        form.isSwallow ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/70 bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading ? "Saving..." : isEdit ? "Update food" : "Add food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
