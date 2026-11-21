import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  Crown,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingBlock,
  RefreshButton,
  SearchField,
  SectionHeading,
  StatCard,
  StatusPill,
} from "@/components/admin";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchSuperadminStatus,
  getToken,
  useActivateSuperadminMutation,
  useBlockSuperadminAdminMutation,
  useCreateSuperadminAdminMutation,
  useRemoveSuperadminAdminMutation,
  useSetSuperadminAdminStatusMutation,
  useSuperadminAdminsQuery,
  useSuperadminMeQuery,
  useSuperadminStatusQuery,
  useUnblockSuperadminAdminMutation,
} from "@/lib/api";
import {
  formatAdminRole,
  getAdminIdentity,
  getAdminRole,
  isSuperAdmin,
  persistAdminSession,
} from "@/lib/adminSession";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard-superadmin")({
  head: () => ({
    meta: [
      { title: "Super Admin — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    // UX guard only — the backend is the authoritative permission boundary.
    // A signed-in regular admin may reach this route only while activation is
    // still pending; once a Super Admin exists they are redirected away.
    if (!getToken("admin")) {
      throw redirect({ to: "/adminlogin", replace: true });
    }
    if (isSuperAdmin()) return;

    try {
      const status = await fetchSuperadminStatus();
      if (!status.exists) return; // no Super Admin yet — activation is allowed
    } catch {
      return; // let the page render its own status error state
    }

    throw redirect({ to: "/admin-dashboard", replace: true });
  },
  component: SuperAdminPage,
});

const PAGE_LIMIT = 10;
const EMPTY_FORM = { username: "", email: "", password: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
];
const STATUS_TONES = { active: "fresh", inactive: "neutral", blocked: "rose" };
const ACTION_MESSAGES = {
  activate: { success: "Admin activated", error: "Could not activate admin" },
  deactivate: { success: "Admin deactivated", error: "Could not deactivate admin" },
  block: { success: "Admin blocked", error: "Could not block admin" },
  unblock: { success: "Admin unblocked", error: "Could not unblock admin" },
  delete: { success: "Admin account removed", error: "Could not remove admin account" },
};
const CONFIRM_ACTIONS = new Set(["deactivate", "block", "delete"]);

function toNumber(value) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function accountId(account) {
  return account?._id ?? account?.id ?? "";
}

function accountKey(account, index = 0) {
  return accountId(account) || account?.email || `admin-${index}`;
}

function accountName(account) {
  return account?.username ?? account?.fullName ?? account?.name ?? "Unnamed admin";
}

function accountEmail(account) {
  return account?.email ?? "No email on record";
}

function accountRole(account) {
  return getAdminRole(account) ?? "admin";
}

function accountIsSuper(account) {
  return isSuperAdmin(account);
}

function accountStatus(account) {
  const raw = typeof account?.status === "string" ? account.status.toLowerCase() : "";
  if (["blocked", "banned", "suspended"].includes(raw)) return "blocked";
  if (["inactive", "disabled", "deactivated"].includes(raw)) return "inactive";
  if (raw === "active") return "active";
  if (typeof account?.isActive === "boolean") return account.isActive ? "active" : "inactive";
  return "active";
}

function statusLabel(status) {
  if (status === "blocked") return "Blocked";
  if (status === "inactive") return "Inactive";
  return "Active";
}

function formatDate(value) {
  if (value === null || value === undefined || value === "") return "—";
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

function validateForm(form) {
  const errors = {};
  if (!form.username.trim()) errors.username = "Name is required";
  else if (form.username.trim().length < 3) errors.username = "Use at least 3 characters";

  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address";

  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8) errors.password = "Use at least 8 characters";

  return errors;
}

function SuperAdminPage() {
  const queryClient = useQueryClient();

  const statusQuery = useSuperadminStatusQuery();
  const meQuery = useSuperadminMeQuery();
  const activateMutation = useActivateSuperadminMutation();
  const createMutation = useCreateSuperadminAdminMutation();
  const setStatusMutation = useSetSuperadminAdminStatusMutation();
  const blockMutation = useBlockSuperadminAdminMutation();
  const unblockMutation = useUnblockSuperadminAdminMutation();
  const removeMutation = useRemoveSuperadminAdminMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingAction, setPendingAction] = useState(null);

  // Called unconditionally so every hook stays mounted across the activation gate.
  const adminsQuery = useSuperadminAdminsQuery({
    search,
    status: statusFilter,
    page,
    limit: PAGE_LIMIT,
    // Avoid a guaranteed 403 while the activation gate is being shown.
    enabled: statusQuery.data?.exists === true && Boolean(getToken("admin")),
  });

  const currentAdmin = getAdminIdentity();
  const admins = useMemo(
    () =>
      Array.isArray(adminsQuery.data?.admins)
        ? adminsQuery.data.admins.filter((account) => account && typeof account === "object")
        : [],
    [adminsQuery.data?.admins],
  );

  const derivedStats = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((account) => accountStatus(account) === "active").length,
      inactive: admins.filter((account) => accountStatus(account) === "inactive").length,
      blocked: admins.filter((account) => accountStatus(account) === "blocked").length,
    }),
    [admins],
  );

  const stats = useMemo(() => {
    const source = adminsQuery.data?.stats;
    if (!source || typeof source !== "object") return derivedStats;
    return {
      total: toNumber(source.total ?? derivedStats.total),
      active: toNumber(source.active ?? derivedStats.active),
      inactive: toNumber(source.inactive ?? derivedStats.inactive),
      blocked: toNumber(source.blocked ?? derivedStats.blocked),
    };
  }, [adminsQuery.data?.stats, derivedStats]);

  const pagination = adminsQuery.data?.pagination ?? {};
  const totalPages = Math.max(1, toNumber(pagination.pages) || 1);
  const currentPage = Math.min(Math.max(1, toNumber(pagination.page) || page), totalPages);
  const resultTotal = toNumber(pagination.total ?? stats.total);
  const pageStart = resultTotal === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const pageEnd = Math.min(currentPage * PAGE_LIMIT, resultTotal);

  const isBusy =
    createMutation.isPending ||
    setStatusMutation.isPending ||
    blockMutation.isPending ||
    unblockMutation.isPending ||
    removeMutation.isPending;

  const isSelf = (account) => {
    const id = accountId(account);
    const currentId = currentAdmin?.id ?? currentAdmin?._id ?? meQuery.data?.id;
    if (id && currentId && String(id) === String(currentId)) return true;
    const currentEmail = currentAdmin?.email ?? meQuery.data?.email;
    return Boolean(
      currentEmail &&
        account?.email &&
        String(currentEmail).toLowerCase() === String(account.email).toLowerCase(),
    );
  };

  const canManage = (account) => !accountIsSuper(account) && !isSelf(account);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    void adminsQuery.refetch();
  };

  const handleActivate = async (key) => {
    await activateMutation.mutateAsync({ activationKey: key });
    // The backend is authoritative for the role; mirror it into the browser
    // session so the sidebar and route guard update immediately. The existing
    // token stays valid (activation does not revoke sessions).
    persistAdminSession(getToken("admin"), {
      ...(getAdminIdentity() || {}),
      role: "superadmin",
    });
    toast.success("Super Admin activated");
    // Prefix invalidation covers status, me and admins regardless of key shape.
    await queryClient.invalidateQueries({ queryKey: ["superadmin"] });
    await Promise.all([statusQuery.refetch(), meQuery.refetch(), adminsQuery.refetch()]);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormOpen(true);
  };

  const closeCreate = () => {
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      // Never send a role — the backend always creates regular admins.
      await createMutation.mutateAsync({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Admin account created");
      closeCreate();
    } catch (error) {
      toast.error(error?.message || "Could not create admin account");
    }
  };

  const performAction = async (type, account) => {
    const id = accountId(account);
    try {
      if (type === "activate") {
        await setStatusMutation.mutateAsync({ id, status: "active" });
      } else if (type === "deactivate") {
        await setStatusMutation.mutateAsync({ id, status: "inactive" });
      } else if (type === "block") {
        await blockMutation.mutateAsync({ id });
      } else if (type === "unblock") {
        await unblockMutation.mutateAsync({ id });
      } else if (type === "delete") {
        await removeMutation.mutateAsync({ id });
      }
      toast.success(ACTION_MESSAGES[type].success);
      return true;
    } catch (error) {
      toast.error(error?.message || ACTION_MESSAGES[type].error);
      return false;
    }
  };

  const requestAction = (type, account) => {
    if (!canManage(account)) return;
    if (CONFIRM_ACTIONS.has(type)) {
      setPendingAction({ type, account });
      return;
    }
    void performAction(type, account);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const succeeded = await performAction(pendingAction.type, pendingAction.account);
    if (succeeded) setPendingAction(null);
  };

  const pendingMutation =
    pendingAction?.type === "block"
      ? blockMutation
      : pendingAction?.type === "delete"
        ? removeMutation
        : pendingAction?.type === "deactivate"
          ? setStatusMutation
          : null;
  const confirmPending = Boolean(pendingMutation?.isPending);

  if (statusQuery.isPending) {
    return (
      <AdminShell
        eyebrow="Security · Super Admin"
        title="Super Admin"
        description="Manage the administrator accounts that can access this dashboard."
      >
        <LoadingBlock
          variant="table"
          rows={6}
          label="Loading Super Admin status"
          caption="Checking administrator privileges…"
        />
      </AdminShell>
    );
  }

  if (statusQuery.isError) {
    return (
      <AdminShell
        eyebrow="Security · Super Admin"
        title="Super Admin"
        description="Manage the administrator accounts that can access this dashboard."
      >
        <ErrorState
          title="Couldn't check Super Admin status"
          description={statusQuery.error?.message || "Please try again in a moment."}
          onRetry={() => statusQuery.refetch()}
          retryLabel={statusQuery.isFetching ? "Retrying…" : "Retry"}
        />
      </AdminShell>
    );
  }

  if (statusQuery.data?.exists === false) {
    return (
      <ActivationGate
        statusQuery={statusQuery}
        onActivate={handleActivate}
        isPending={activateMutation.isPending}
      />
    );
  }

  const hasFilters = Boolean(search.trim()) || statusFilter !== "all";

  return (
    <AdminShell
      eyebrow="Security · Super Admin"
      title="Super Admin"
      description="Create and manage administrator accounts. Only the Super Admin can change who has access to this dashboard."
      actions={
        <StatusPill tone="gold">
          <Crown className="mr-1 h-3 w-3" aria-hidden="true" />
          Super Admin
        </StatusPill>
      }
    >
      <div className="min-w-0 space-y-6">
        <section aria-label="Administrator statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Admins"
            value={stats.total}
            hint="All administrator accounts"
            icon={Users}
            tone="forest"
            isLoading={adminsQuery.isPending}
          />
          <StatCard
            label="Active Admins"
            value={stats.active}
            hint="Currently able to sign in"
            icon={UserCheck}
            tone="fresh"
            isLoading={adminsQuery.isPending}
          />
          <StatCard
            label="Inactive Admins"
            value={stats.inactive}
            hint="Sign-in temporarily disabled"
            icon={UserX}
            tone="neutral"
            isLoading={adminsQuery.isPending}
          />
          <StatCard
            label="Blocked Admins"
            value={stats.blocked}
            hint="Access revoked immediately"
            icon={Ban}
            tone="rose"
            isLoading={adminsQuery.isPending}
          />
        </section>

        <AdminPanel as="section" className="min-w-0 p-5 sm:p-6" aria-label="Administrator directory">
          <SectionHeading
            eyebrow="Access control"
            title="Administrator directory"
            description="Activate, deactivate, block or remove admin accounts. Your own account and the Super Admin account are protected."
          />

          <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)]">
              <SearchField
                id="superadmin-search"
                label="Search administrators"
                placeholder="Search name or email"
                value={search}
                onChange={handleSearch}
              />
              <FilterSelect
                id="superadmin-status-filter"
                label="Filter administrators by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <RefreshButton
                onClick={handleRefresh}
                isFetching={adminsQuery.isFetching}
                label={adminsQuery.isFetching ? "Refreshing…" : "Refresh"}
              />
              <Button onClick={openCreate} className="rounded-xl" disabled={isBusy}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add admin
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {adminsQuery.isPending
                ? "Loading administrators…"
                : `Showing ${pageStart}–${pageEnd} of ${resultTotal} admins`}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="mt-4 min-w-0">
            {adminsQuery.isPending ? (
              <LoadingBlock
                variant="table"
                rows={6}
                label="Loading administrators"
                caption="Fetching the administrator directory…"
              />
            ) : adminsQuery.isError ? (
              <ErrorState
                title="Couldn't load administrator accounts"
                description={
                  adminsQuery.error?.message ||
                  "The administrator directory is temporarily unavailable."
                }
                onRetry={handleRefresh}
                retryLabel={adminsQuery.isFetching ? "Retrying…" : "Try again"}
              />
            ) : admins.length === 0 ? (
              <EmptyState
                icon={hasFilters ? Search : ShieldCheck}
                title={hasFilters ? "No matching admins" : "No admin accounts yet"}
                description={
                  hasFilters
                    ? "Try a different name, email or status filter."
                    : "Add an admin to share dashboard access with a teammate."
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setPage(1);
                    }} className="rounded-xl">
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={openCreate} className="rounded-xl">
                      <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Add admin
                    </Button>
                  )
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-2xl border border-border/70 md:block">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <caption className="sr-only">Administrator accounts</caption>
                    <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Administrator</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Added</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {admins.map((account, index) => {
                        const status = accountStatus(account);
                        return (
                          <tr key={accountKey(account, index)} className="transition hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                  {accountName(account).slice(0, 2).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="truncate font-semibold text-foreground">
                                      {accountName(account)}
                                    </p>
                                    {isSelf(account) ? (
                                      <StatusPill tone="gold" dot={false}>You</StatusPill>
                                    ) : null}
                                    {accountIsSuper(account) ? (
                                      <StatusPill tone="gold" dot={false}>Super Admin</StatusPill>
                                    ) : null}
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {accountEmail(account)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill tone={accountIsSuper(account) ? "gold" : "blue"}>
                                {formatAdminRole(accountRole(account))}
                              </StatusPill>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill tone={STATUS_TONES[status]}>{statusLabel(status)}</StatusPill>
                              {status === "blocked" && account?.blockedAt ? (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Blocked {formatDate(account.blockedAt)}
                                </p>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                              {formatDate(account?.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <AdminActions
                                account={account}
                                status={status}
                                canManage={canManage(account)}
                                busy={isBusy}
                                onAction={requestAction}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mt-4 grid gap-3 md:hidden">
                  {admins.map((account, index) => {
                    const status = accountStatus(account);
                    return (
                      <AdminPanel
                        as="article"
                        key={accountKey(account, index)}
                        className="p-4 shadow-none"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                            {accountName(account).slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate font-semibold text-foreground">
                                {accountName(account)}
                              </p>
                              {isSelf(account) ? (
                                <StatusPill tone="gold" dot={false}>You</StatusPill>
                              ) : null}
                              {accountIsSuper(account) ? (
                                <StatusPill tone="gold" dot={false}>Super Admin</StatusPill>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {accountEmail(account)}
                            </p>
                          </div>
                          <StatusPill tone={accountIsSuper(account) ? "gold" : "blue"}>
                            {formatAdminRole(accountRole(account))}
                          </StatusPill>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                          <div>
                            <StatusPill tone={STATUS_TONES[status]}>{statusLabel(status)}</StatusPill>
                            {status === "blocked" && account?.blockedAt ? (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Blocked {formatDate(account.blockedAt)}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Added {formatDate(account?.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end border-t border-border/60 pt-3">
                          <AdminActions
                            account={account}
                            status={status}
                            canManage={canManage(account)}
                            busy={isBusy}
                            onAction={requestAction}
                          />
                        </div>
                      </AdminPanel>
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <nav
                    className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row"
                    aria-label="Pagination"
                  >
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={currentPage === 1 || adminsQuery.isFetching}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const active = pageNumber === currentPage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            aria-label={`Go to page ${pageNumber}`}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border bg-card text-foreground hover:bg-secondary",
                            )}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={currentPage === totalPages || adminsQuery.isFetching}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </AdminPanel>
      </div>

      {/* Create admin dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => (open ? null : closeCreate())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-wide">Add admin account</DialogTitle>
            <DialogDescription>
              This person will be able to use the admin dashboard, but will not be able to manage
              administrator accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCreate} className="space-y-4" noValidate>
            <div>
              <label htmlFor="superadmin-form-name" className="text-xs font-semibold text-foreground">
                Name
              </label>
              <input
                id="superadmin-form-name"
                value={form.username}
                onChange={(event) => {
                  setForm((current) => ({ ...current, username: event.target.value }));
                  setFieldErrors((current) => ({ ...current, username: undefined }));
                }}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? "superadmin-name-error" : undefined}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Admin name"
              />
              {fieldErrors.username ? (
                <p id="superadmin-name-error" role="alert" className="mt-1 text-xs text-destructive">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="superadmin-form-email" className="text-xs font-semibold text-foreground">
                Email address
              </label>
              <div className="relative mt-1.5">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="superadmin-form-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }));
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "superadmin-email-error" : undefined}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="admin@dunnkayce.com"
                />
              </div>
              {fieldErrors.email ? (
                <p id="superadmin-email-error" role="alert" className="mt-1 text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="superadmin-form-password" className="text-xs font-semibold text-foreground">
                Temporary password
              </label>
              <input
                id="superadmin-form-password"
                type="password"
                value={form.password}
                onChange={(event) => {
                  setForm((current) => ({ ...current, password: event.target.value }));
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "superadmin-password-error" : undefined}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="At least 8 characters"
              />
              {fieldErrors.password ? (
                <p id="superadmin-password-error" role="alert" className="mt-1 text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeCreate} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
                {createMutation.isPending ? "Creating…" : "Create admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation for deactivate / block / delete */}
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => (open ? null : setPendingAction(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? "Remove this admin account?"
                : pendingAction?.type === "block"
                  ? "Block this admin?"
                  : "Deactivate this admin?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!pendingAction
                ? null
                : pendingAction.type === "delete"
                  ? `${accountName(pendingAction.account)} will be permanently removed and immediately signed out. This cannot be undone.`
                  : pendingAction.type === "block"
                    ? `${accountName(pendingAction.account)} will be immediately signed out and blocked from signing in until you unblock them.`
                    : `${accountName(pendingAction.account)} will be immediately signed out and will not be able to sign in until reactivated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmPendingAction();
              }}
              disabled={confirmPending}
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {confirmPending
                ? "Working…"
                : pendingAction?.type === "delete"
                  ? "Remove admin"
                  : pendingAction?.type === "block"
                    ? "Block admin"
                    : "Deactivate admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function AdminActions({ account, status, canManage, busy, onAction }) {
  const name = accountName(account);
  const shared = { type: "button", variant: "ghost", size: "icon", className: "rounded-lg" };
  const disabled = !canManage || busy;
  const reason = "You cannot manage your own account or the Super Admin account";

  return (
    <div className="flex justify-end gap-1.5">
      {status === "active" ? (
        <Button
          {...shared}
          aria-label={`Deactivate ${name}`}
          title={canManage ? "Deactivate admin" : reason}
          disabled={disabled}
          onClick={() => onAction("deactivate", account)}
        >
          <UserX aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          {...shared}
          aria-label={`Activate ${name}`}
          title={canManage ? "Activate admin" : reason}
          disabled={disabled}
          onClick={() => onAction("activate", account)}
        >
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      {status === "blocked" ? (
        <Button
          {...shared}
          aria-label={`Unblock ${name}`}
          title={canManage ? "Unblock admin" : reason}
          disabled={disabled}
          onClick={() => onAction("unblock", account)}
        >
          <Unlock aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          {...shared}
          aria-label={`Block ${name}`}
          title={canManage ? "Block admin" : reason}
          disabled={disabled}
          onClick={() => onAction("block", account)}
        >
          <Ban aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      <Button
        {...shared}
        className="rounded-lg text-destructive hover:text-destructive"
        aria-label={`Delete ${name}`}
        title={canManage ? "Delete admin" : reason}
        disabled={disabled}
        onClick={() => onAction("delete", account)}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ActivationGate({ statusQuery, onActivate, isPending }) {
  const [activationKey, setActivationKey] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const key = activationKey.trim();
    if (!key) {
      setError("Enter the activation key to continue.");
      return;
    }

    setError("");
    try {
      await onActivate(key);
      setActivationKey("");
    } catch (activationError) {
      const status = activationError?.status ?? activationError?.payload?.status;
      let message = activationError?.message || "Could not activate Super Admin";
      if (status === 403) message = "Invalid activation key — use SUPER_ADMIN_ACTIVATION_KEY";
      else if (status === 409) message = "A Super Admin already exists";
      else if (status === 503) {
        message = "Activation is not configured. Add SUPER_ADMIN_ACTIVATION_KEY to the backend .env and restart the server.";
      }
      setError(message);
      toast.error(message);
      void statusQuery.refetch();
    }
  };

  const signedIn = Boolean(getToken("admin"));

  return (
    <AdminShell
      eyebrow="Security · Super Admin"
      title="Super Admin"
      description="Manage the administrator accounts that can access this dashboard."
    >
      <AdminPanel className="mx-auto max-w-2xl p-6 text-center sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-warning/40 bg-warning/15 text-warning-foreground">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-2xl tracking-wide text-foreground">
          Activate Super Admin
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          No Super Admin is active yet. Sign in with an administrator account, then enter the
          activation key supplied by your organisation to take ownership of admin management.
        </p>
        <div className="mx-auto mt-4 max-w-lg rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-left text-xs leading-5 text-foreground/90">
          <span className="font-bold text-gold">Which key?</span> Use{" "}
          <code className="rounded bg-background/70 px-1 py-0.5 font-mono">SUPER_ADMIN_ACTIVATION_KEY</code>{" "}
          from the <strong>backend .env</strong>. The{" "}
          <code className="rounded bg-background/70 px-1 py-0.5 font-mono">ADMIN_BOOTSTRAP_KEY</code> you may
          have used to create the first admin is <strong>not</strong> the activation key. After this
          one-time step, the “Super Admin” menu item and admin management tools appear.
        </div>

        {signedIn ? (
          <form onSubmit={submit} className="mx-auto mt-7 max-w-md space-y-4 text-left" noValidate>
            <div>
              <label htmlFor="activation-key" className="text-xs font-semibold text-foreground">
                Activation key
              </label>
              <input
                id="activation-key"
                type="password"
                value={activationKey}
                onChange={(event) => {
                  setActivationKey(event.target.value);
                  setError("");
                }}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "activation-key-error" : "activation-key-hint"}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter activation key"
              />
              <p id="activation-key-hint" className="mt-1 text-xs text-muted-foreground">
                The key is only used for this request and is never stored in your browser.
              </p>
              {error ? (
                <p id="activation-key-error" role="alert" className="mt-1 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={isPending} className="w-full rounded-xl">
              {isPending ? "Activating…" : "Activate Super Admin"}
            </Button>
          </form>
        ) : (
          <div className="mx-auto mt-7 max-w-md">
            <p className="text-sm font-semibold text-foreground">Sign in as an administrator first.</p>
            <Button asChild className="mt-4 w-full rounded-xl">
              <Link to="/adminlogin">Go to admin sign in</Link>
            </Button>
          </div>
        )}
      </AdminPanel>
    </AdminShell>
  );
}
