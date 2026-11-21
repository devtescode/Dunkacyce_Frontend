import { useQuery } from "@tanstack/react-query";

import { api, getToken } from "./client";
import { queryKeys } from "./keys";

// Tolerate both the factory-function and flat-array shapes of `all` keys.
const foodsKey =
  typeof queryKeys.foods.all === "function"
    ? queryKeys.foods.all()
    : queryKeys.foods.all;

/* ---------------------------------- food --------------------------------- */

export async function fetchFoods() {
  const data = await api.get("/food");
  return data?.foods ?? [];
}

export function useFoodsQuery(options = {}) {
  return useQuery({
    queryKey: foodsKey,
    queryFn: fetchFoods,
    staleTime: 10_000,
    ...options,
  });
}

/* -------------------------------- settings -------------------------------- */

export async function fetchRushHour() {
  const data = await api.get("/settings/rush-hour");
  return Boolean(data?.rushHour);
}

/** `data` is a boolean. */
export function useRushHourQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.settings.rushHour(),
    queryFn: fetchRushHour,
    staleTime: 10_000,
    ...options,
  });
}

/* ---------------------------------- cart ---------------------------------- */

export async function fetchCurrentUserCart() {
  const data = await api.get("/cart/getusercart", { auth: "user" });
  return data?.cart ?? [];
}

/** `data` is a CartItem[]. Disabled until a user token exists. */
export function useCurrentUserCartQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: fetchCurrentUserCart,
    enabled: Boolean(getToken("user")),
    ...options,
  });
}

/* --------------------------------- orders --------------------------------- */

export async function fetchUserOrders(userId) {
  const data = await api.get(`/orders/user/${encodeURIComponent(userId)}`);
  return data?.orders ?? [];
}

/** `data` is an Order[]. */
export function useUserOrdersQuery(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.user(userId),
    queryFn: () => fetchUserOrders(userId),
    enabled: Boolean(userId),
    ...options,
  });
}

export async function fetchPaymentHistory(userId) {
  const data = await api.get(`/orders/user/${encodeURIComponent(userId)}/receipts`);
  return data?.orders ?? [];
}

/** `data` is a receipt Order[]. */
export function usePaymentHistoryQuery(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.receipts(userId),
    queryFn: () => fetchPaymentHistory(userId),
    enabled: Boolean(userId),
    ...options,
  });
}

/* --------------------------------- profile -------------------------------- */

export async function fetchProfile() {
  const data = await api.get("/dunnkayce/profile", { auth: "user" });
  return data?.user ?? null;
}

/** `data` is the current user profile, or null. Disabled until a user token exists. */
export function useProfileQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: fetchProfile,
    enabled: Boolean(getToken("user")),
    ...options,
  });
}

/* ---------------------------------- admin --------------------------------- */

export async function fetchAdminExists() {
  const data = await api.get("/admin/exists");
  return Boolean(data?.exists);
}

export function useAdminExistsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.auth.adminExists(),
    queryFn: fetchAdminExists,
    ...options,
  });
}

export async function fetchAdminDashboardStats() {
  const data = await api.get("/admin/dashboard-stats", { auth: "admin" });
  return {
    totalStudents: data?.totalStudents ?? 0,
    totalOrders: data?.totalOrders ?? 0,
    weeklyRevenue: data?.weeklyRevenue ?? 0,
    paidStudents: data?.paidStudents ?? 0,
    studentsToDelivery: data?.studentsToDelivery ?? 0,
    lowStockSwallows: Array.isArray(data?.lowStockSwallows) ? data.lowStockSwallows : [],
    lowStockSwallowCount: Number(data?.lowStockSwallowCount ?? (Array.isArray(data?.lowStockSwallows) ? data.lowStockSwallows.length : 0)) || 0,
  };
}

export function useAdminDashboardStatsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.dashboardStats(),
    queryFn: fetchAdminDashboardStats,
    ...options,
  });
}

export async function fetchAdminOrders() {
  const data = await api.get("/admin/getorders", { auth: "admin" });
  return data?.orders ?? [];
}

export function useAdminOrdersQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.orders(),
    queryFn: fetchAdminOrders,
    ...options,
  });
}

export async function fetchAdminCarts() {
  const data = await api.get("/admin/carts", { auth: "admin" });
  return data?.carts ?? [];
}

export function useAdminCartsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.carts(),
    queryFn: fetchAdminCarts,
    ...options,
  });
}

export async function fetchAdminUsers() {
  const data = await api.get("/admin/users", { auth: "admin" });
  return data?.users ?? [];
}

export function useAdminUsersQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: fetchAdminUsers,
    ...options,
  });
}

/* --------------------------- admin accounts --------------------------- */

/**
 * Super Admin only. Requires the backend contract documented in
 * ADMIN_ACCOUNTS.md: GET /admin/admins with the admin Bearer token.
 */
export async function fetchAdminAccounts() {
  const data = await api.get("/admin/admins", { auth: "admin" });
  const list = data?.admins ?? data?.adminAccounts ?? data?.users ?? data;
  return Array.isArray(list) ? list : [];
}

export function useAdminAccountsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.admins(),
    queryFn: fetchAdminAccounts,
    enabled: Boolean(getToken("admin")),
    ...options,
  });
}

/* -------------------------------- superadmin ------------------------------- */

/**
 * Public status probe. No auth token is sent.
 * `data` is `{ exists, hasSuperAdmin, activated }` with boolean fields.
 */
export async function fetchSuperadminStatus() {
  const data = await api.get("/api/superadmin/status");
  return {
    exists: Boolean(data?.exists),
    hasSuperAdmin: Boolean(data?.hasSuperAdmin),
    activated: Boolean(data?.activated),
  };
}

/** `data` is the normalized superadmin status object. */
export function useSuperadminStatusQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.superadmin.status(),
    queryFn: fetchSuperadminStatus,
    ...options,
  });
}

/** Fetch the current admin's superadmin capabilities. Requires an admin token. */
export async function fetchSuperadminMe() {
  return api.get("/api/superadmin/me", { auth: "admin" });
}

/** `data` is `{ id, email, username, role, status, canManageAdmins }`. */
export function useSuperadminMeQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.superadmin.me(),
    queryFn: fetchSuperadminMe,
    enabled: Boolean(getToken("admin")),
    ...options,
  });
}

/**
 * Super Admin only. Lists managed admins with stats and pagination.
 * `data` is `{ admins, stats, pagination }`.
 */
export async function fetchSuperadminAdmins({
  search = "",
  status = "all",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    search: String(search),
    status: String(status),
    page: String(page),
    limit: String(limit),
  });
  const query = params.toString();
  const path = `/api/superadmin/admins${query ? `?${query}` : ""}`;
  const data = await api.get(path, { auth: "admin" });
  const admins = data?.admins ?? [];
  return { ...(data && typeof data === "object" ? data : {}), admins };
}

/** Managed-admins list, refetched whenever a filter changes. */
export function useSuperadminAdminsQuery({ search, status, page, limit, ...options } = {}) {
  return useQuery({
    queryKey: [...queryKeys.superadmin.admins(), search, status, page, limit],
    queryFn: () => fetchSuperadminAdmins({ search, status, page, limit }),
    enabled: Boolean(getToken("admin")),
    ...options,
  });
}
