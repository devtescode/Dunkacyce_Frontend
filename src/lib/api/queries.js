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
  const data = await api.get("/admin/dashboard-stats");
  return {
    totalStudents: data?.totalStudents ?? 0,
    totalOrders: data?.totalOrders ?? 0,
    weeklyRevenue: data?.weeklyRevenue ?? 0,
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
  const data = await api.get("/admin/getorders");
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
  const data = await api.get("/admin/carts");
  return data?.carts ?? [];
}

export function useAdminCartsQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.admin.carts(),
    queryFn: fetchAdminCarts,
    ...options,
  });
}
