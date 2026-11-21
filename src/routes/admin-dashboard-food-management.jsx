import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FilterSelect,
  FoodImage,
  LoadingBlock,
  RefreshButton,
  SearchField,
  SectionHeading,
  StatCard,
  StatusPill,
} from "@/components/admin";
import {
  CheckCircle2,
  CircleSlash2,
  Filter,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useFoodsQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} from "@/lib/api";
import { FOOD_HIGHLIGHTS } from "@/lib/foodImages";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin-dashboard-food-management")({
  head: () => ({ meta: [{ title: "Food Management – Dunnkayce Admin" }] }),
  component: FoodManagementPage,
});

const CATEGORY_OPTIONS = [
  { value: "All", label: "All categories" },
  { value: "Foods", label: "Foods" },
  { value: "Protein", label: "Protein" },
];

const STATUS_OPTIONS = [
  { value: "All", label: "All statuses" },
  { value: "Available", label: "Available" },
  { value: "Preparing", label: "Preparing" },
  { value: "Not available", label: "Not available" },
];

const SWALLOW_SOUP_OPTIONS = ["Egusi", "Okro soup", "Awedu", "Vegetable soup"];

const getFoodId = (food) => food?._id ?? food?.id;

const statusTone = (status) => {
  if (status === "Available") return "fresh";
  if (status === "Preparing") return "gold";
  return "rose";
};

const iconActionClass =
  "inline-flex items-center justify-center rounded-lg border border-border bg-background/90 p-2 text-foreground shadow-sm backdrop-blur transition hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

function FoodManagementPage() {
  const { data, isPending, isFetching, isError, refetch } = useFoodsQuery();
  const foods = data ?? [];
  const loading = isPending;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useDeleteFoodMutation();

  const requestDelete = (id, name) => {
    setDeleteTarget({ id, name: name || "this item" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message || "Failed to delete food item");
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

  return (
    <AdminShell
      eyebrow="Menu"
      title="Food Management"
      description="Curate your campus menu with polished food listings, clear availability, and fast editing controls."
      actions={
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep motion-reduce:transition-none"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add food item
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Menu statistics">
          <StatCard
            icon={UtensilsCrossed}
            label="Total items"
            value={stats.total}
            hint="All menu entries"
            tone="forest"
            isLoading={loading}
          />
          <StatCard
            icon={CheckCircle2}
            label="Available"
            value={stats.available}
            hint="Ready to order"
            tone="fresh"
            isLoading={loading}
          />
          <StatCard
            icon={Filter}
            label="Preparing"
            value={stats.preparing}
            hint="Temporarily in prep"
            tone="gold"
            isLoading={loading}
          />
          <StatCard
            icon={CircleSlash2}
            label="Unavailable"
            value={stats.unavailable}
            hint="Hidden from ordering"
            tone="rose"
            isLoading={loading}
          />
        </section>

        <AdminPanel as="section" aria-label="Menu catalog" className="min-w-0 overflow-hidden">
          <div className="border-b border-border/70 p-4 sm:p-5">
            <SectionHeading
              eyebrow="Catalogue"
              title="Menu catalog"
              description="Search, filter, and manage every dish from one place."
              action={
                <RefreshButton
                  onClick={() => refetch()}
                  isFetching={isFetching}
                  label="Refresh menu"
                />
              }
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_11rem] lg:items-center">
              <SearchField
                id="food-search"
                label="Search foods"
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:col-span-2 lg:col-span-1"
              />
              <FilterSelect
                id="food-category-filter"
                label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={CATEGORY_OPTIONS}
              />
              <FilterSelect
                id="food-status-filter"
                label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading && (
              <LoadingBlock
                label="Loading the menu"
                caption="Plating up every dish."
                rows={6}
                variant="cards"
              />
            )}

            {!loading && isError && (
              <ErrorState
                title="Could not load menu items"
                description="Something went wrong while fetching the food catalog."
                onRetry={() => refetch()}
              />
            )}

            {!loading && !isError && foods.length === 0 && (
              <EmptyState
                icon={UtensilsCrossed}
                title="No food items yet"
                description="Start building your menu by adding your first dish."
                action={
                  <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Add food item
                  </button>
                }
              />
            )}

            {!loading && !isError && foods.length > 0 && filteredFoods.length === 0 && (
              <EmptyState
                icon={Filter}
                title="No matching items"
                description="Try adjusting your search or filters to find what you need."
                action={
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("All");
                      setStatusFilter("All");
                    }}
                    className="inline-flex items-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                  >
                    Clear filters
                  </button>
                }
              />
            )}

            {!loading && !isError && filteredFoods.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredFoods.map((food) => {
                  const foodId = getFoodId(food);
                  return (
                    <article
                      key={foodId ?? food.name}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-within:border-primary/30 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      <div className="relative">
                        <FoodImage
                          src={food.imageUrl}
                          alt={food.name ?? "Food item"}
                          seed={foodId ?? food.name}
                          ratio="aspect-[4/3]"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/10 to-transparent"
                        />

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <StatusPill tone={statusTone(food.status)}>{food.status ?? "Unknown"}</StatusPill>
                          {food.isSwallow ? (
                            <span className="inline-flex items-center rounded-full border border-gold/50 bg-gold/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900 backdrop-blur dark:text-amber-100">
                              Swallow
                            </span>
                          ) : null}
                        </div>

                        <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 motion-reduce:transform-none">
                          <button
                            type="button"
                            onClick={() => openEdit(food)}
                            aria-label={`Edit ${food.name}`}
                            title="Edit"
                            className={iconActionClass}
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(foodId, food.name)}
                            disabled={deleteMutation.isPending}
                            aria-label={`Delete ${food.name}`}
                            title="Delete"
                            className={cn(
                              iconActionClass,
                              "hover:border-destructive/50 hover:bg-destructive hover:text-destructive-foreground",
                            )}
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <h3 className="truncate font-display text-xl uppercase tracking-wide text-white drop-shadow-sm sm:text-2xl">
                            {food.name}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium text-emerald-50/80">
                            {food.category}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border/70 bg-card/70 p-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Price
                          </p>
                          <p className="mt-1 font-display text-2xl leading-none text-foreground">
                            ₦{Number(food.price || 0).toLocaleString()}
                          </p>
                          {food.isSwallow ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {Number(food.swallowQuantity || 0).toLocaleString()} swallow
                              {Number(food.swallowQuantity || 0) === 1 ? "" : "s"} available
                              {Array.isArray(food.availableSoups) && food.availableSoups.length > 0
                                ? ` · ${food.availableSoups.length} soup${food.availableSoups.length === 1 ? "" : "s"}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </AdminPanel>

        <MenuInspiration />
      </div>

      {showForm && (
        <FoodForm
          initial={editing}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete food item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name
                ? `“${deleteTarget.name}” will be permanently removed from the menu. This action cannot be undone.`
                : "This food item will be permanently removed from the menu. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

/** Decorative photo strip — these highlights are intentionally not catalog entries. */
function MenuInspiration() {
  return (
    <AdminPanel as="section" aria-labelledby="menu-inspiration-heading" className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-gold" />
          <h2
            id="menu-inspiration-heading"
            className="font-display text-lg uppercase tracking-wide text-foreground sm:text-xl"
          >
            Menu inspiration
          </h2>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Decorative photography only — not catalog entries.
        </p>
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-6">
        {FOOD_HIGHLIGHTS.map((item) => (
          <div key={item.name} className="min-w-0">
            <FoodImage
              src={item.src}
              alt=""
              seed={`inspiration-${item.name}`}
              ratio="aspect-[4/3]"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="rounded-xl ring-1 ring-border/60"
            />
            <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </AdminPanel>
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
    availableSoups: Array.isArray(initial?.availableSoups) ? initial.availableSoups : [],
    swallowQuantity: initial?.swallowQuantity ?? 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(initial?.imageUrl ?? "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [customSoupInput, setCustomSoupInput] = useState("");
  const dialogRef = useRef(null);
  const nameInputRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const focusFrame = requestAnimationFrame(() => nameInputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const setCategory = (cat) => {
    setForm((p) => {
      if (cat !== "Foods") {
        return {
          ...p,
          category: cat,
          isSwallow: false,
          availableSoups: [],
          swallowQuantity: 0,
        };
      }
      return { ...p, category: cat };
    });
    setCustomSoupInput("");
    setFieldErrors((p) => ({
      ...p,
      availableSoups: undefined,
      swallowQuantity: undefined,
    }));
  };

  const toggleSwallow = () => {
    setForm((p) => {
      if (p.isSwallow) {
        return {
          ...p,
          isSwallow: false,
          availableSoups: [],
          swallowQuantity: 0,
        };
      }
      return { ...p, isSwallow: true };
    });
    setCustomSoupInput("");
    setFieldErrors((p) => ({
      ...p,
      availableSoups: undefined,
      swallowQuantity: undefined,
    }));
  };

  const toggleSoup = (soup) => {
    setForm((p) => {
      const exists = p.availableSoups.some(
        (s) => s.toLowerCase() === soup.toLowerCase(),
      );
      return {
        ...p,
        availableSoups: exists
          ? p.availableSoups.filter((s) => s.toLowerCase() !== soup.toLowerCase())
          : [...p.availableSoups, soup],
      };
    });
    setFieldErrors((p) => (p.availableSoups ? { ...p, availableSoups: undefined } : p));
  };

  const addCustomSoup = () => {
    const value = customSoupInput.trim();
    if (!value) return;
    setForm((p) => {
      const exists = p.availableSoups.some(
        (s) => s.toLowerCase() === value.toLowerCase(),
      );
      if (exists) return p;
      return { ...p, availableSoups: [...p.availableSoups, value] };
    });
    setCustomSoupInput("");
    setFieldErrors((p) => (p.availableSoups ? { ...p, availableSoups: undefined } : p));
  };

  const removeSoup = (soup) => {
    setForm((p) => ({
      ...p,
      availableSoups: p.availableSoups.filter(
        (s) => s.toLowerCase() !== soup.toLowerCase(),
      ),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const swallowQty = Number(form.swallowQuantity);
    const isSwallowFood = form.category === "Foods" && form.isSwallow;
    const nextErrors = {
      name: form.name ? undefined : "Food name is required.",
      price: form.price ? undefined : "Price is required.",
      image: !form.imageUrl && !imageFile ? "Upload a photo to continue." : undefined,
      swallowQuantity:
        isSwallowFood &&
        (form.swallowQuantity === "" ||
          form.swallowQuantity === null ||
          form.swallowQuantity === undefined ||
          !Number.isFinite(swallowQty) ||
          swallowQty < 0 ||
          !Number.isInteger(swallowQty))
          ? "Enter a valid swallow quantity (0 or more)."
          : undefined,
      availableSoups:
        isSwallowFood && (!Array.isArray(form.availableSoups) || form.availableSoups.length === 0)
          ? "Select or add at least one soup."
          : undefined,
    };
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(nextErrors);
      if (nextErrors.name || nextErrors.price || nextErrors.image) {
        return toast.error("Name, price and image file are required");
      }
      return toast.error("Please complete the swallow details");
    }

    setFieldErrors({});
    try {
      setLoading(true);
      const normalizedAvailableSoups = isSwallowFood ? form.availableSoups : [];
      const normalizedSwallowQuantity = isSwallowFood ? Number(form.swallowQuantity) : 0;
      let payload;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        if (isEdit && form.imageUrl) formData.append("imageUrl", form.imageUrl);
        formData.append("name", form.name);
        formData.append("price", Number(form.price));
        formData.append("category", form.category);
        formData.append("status", form.status);
        formData.append("isSwallow", isSwallowFood ? "true" : "false");
        formData.append("availableSoups", JSON.stringify(normalizedAvailableSoups));
        formData.append("swallowQuantity", String(normalizedSwallowQuantity));
        payload = formData;
      } else {
        payload = {
          ...form,
          price: Number(form.price),
          isSwallow: isSwallowFood,
          availableSoups: normalizedAvailableSoups,
          swallowQuantity: normalizedSwallowQuantity,
        };
      }

      const data = isEdit
        ? await updateMutation.mutateAsync({ id: getFoodId(initial), payload })
        : await createMutation.mutateAsync(payload);

      toast.success(isEdit ? "Food updated" : "Food added");
      onSaved(data?.food, isEdit);
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

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl sm:rounded-3xl"
      >
        <div className="relative isolate overflow-hidden border-b border-forest/10 bg-forest-deep px-5 py-5 text-white sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(120%_160%_at_100%_0%,rgba(255,255,255,0.16),transparent_55%),linear-gradient(120deg,#062a1c_0%,#0b402b_60%,#0d4a31_100%)]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                {isEdit ? "Update item" : "New item"}
              </p>
              <h3 id="food-form-title" className="mt-2 font-display text-2xl uppercase tracking-wide sm:text-3xl">
                {isEdit ? "Edit food" : "Add food item"}
              </h3>
              <p className="mt-1 text-sm text-emerald-50/75">
                Set menu details, pricing, availability, and an appetizing photo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none"
              aria-label="Close dialog"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Food name</span>
                <input
                  ref={nameInputRef}
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Jollof Rice"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.name) || undefined}
                  aria-describedby={fieldErrors.name ? "food-name-error" : undefined}
                />
                {fieldErrors.name ? (
                  <p id="food-name-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Price (₦)</span>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="e.g. 1500"
                  aria-invalid={Boolean(fieldErrors.price) || undefined}
                  aria-describedby={fieldErrors.price ? "food-price-error" : undefined}
                />
                {fieldErrors.price ? (
                  <p id="food-price-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                    {fieldErrors.price}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Status</span>
                <select
                  className={inputClass}
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
                        "rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-secondary",
                      )}
                      aria-pressed={active}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <ImagePlus aria-hidden="true" className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Food image / photo</span>
              </div>
              <label className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-3 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring motion-reduce:transition-none">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/15"
                  aria-invalid={Boolean(fieldErrors.image) || undefined}
                  aria-describedby={fieldErrors.image ? "food-image-error" : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    } else {
                      setPreview(initial?.imageUrl ?? "");
                    }
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                {isEdit
                  ? "Upload a new photo to replace the current one, or leave empty to keep it."
                  : "Upload a clear photo of the dish. This is required for new items."}
              </p>
              {fieldErrors.image ? (
                <p id="food-image-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                  {fieldErrors.image}
                </p>
              ) : null}

              {preview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-background">
                  <FoodImage
                    src={preview}
                    alt={form.name ? `${form.name} preview` : "Food preview"}
                    seed={isEdit ? getFoodId(initial) : "new-food"}
                    ratio="aspect-[4/3]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
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
                    onClick={toggleSwallow}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      form.isSwallow ? "border-primary bg-primary" : "border-input bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        form.isSwallow ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {form.isSwallow && (
                  <div className="mt-4 space-y-5 border-t border-border/70 pt-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Available soups</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select one or more soups customers can pick with this swallow.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {SWALLOW_SOUP_OPTIONS.map((soup) => {
                          const selected = form.availableSoups.some(
                            (s) => s.toLowerCase() === soup.toLowerCase(),
                          );
                          return (
                            <button
                              key={soup}
                              type="button"
                              onClick={() => toggleSoup(soup)}
                              aria-pressed={selected}
                              className={cn(
                                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                                selected
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-input bg-background text-foreground hover:bg-secondary",
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background",
                                )}
                              >
                                {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                              </span>
                              <span>{soup}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="custom-soup-input" className="text-sm font-medium text-foreground">
                        Others
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a custom soup if it is not listed above.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          id="custom-soup-input"
                          className={inputClass}
                          value={customSoupInput}
                          onChange={(e) => setCustomSoupInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomSoup();
                            }
                          }}
                          placeholder="e.g. Efo riro"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={addCustomSoup}
                          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
                        >
                          Add
                        </button>
                      </div>

                      {form.availableSoups.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2" aria-label="Selected soups">
                          {form.availableSoups.map((soup) => (
                            <span
                              key={soup.toLowerCase()}
                              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
                            >
                              {soup}
                              <button
                                type="button"
                                onClick={() => removeSoup(soup)}
                                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Remove ${soup}`}
                              >
                                <X aria-hidden="true" className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {fieldErrors.availableSoups ? (
                        <p id="food-available-soups-error" role="alert" className="mt-2 text-xs font-medium text-destructive">
                          {fieldErrors.availableSoups}
                        </p>
                      ) : null}
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Available swallow quantity</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={inputClass}
                        value={form.swallowQuantity}
                        onChange={(e) => set("swallowQuantity", e.target.value)}
                        placeholder="How many swallows are available?"
                        aria-invalid={Boolean(fieldErrors.swallowQuantity) || undefined}
                        aria-describedby={fieldErrors.swallowQuantity ? "food-swallow-quantity-error" : undefined}
                      />
                      {fieldErrors.swallowQuantity ? (
                        <p id="food-swallow-quantity-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                          {fieldErrors.swallowQuantity}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Enter how many portions of this swallow are available.
                        </p>
                      )}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/70 bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading || undefined}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              {loading ? "Saving..." : isEdit ? "Update food" : "Add food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
