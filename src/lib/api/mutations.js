import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";
import { queryKeys } from "./keys";

// Tolerate both the factory-function and flat-array shapes of `all` keys.
const ordersKey =
  typeof queryKeys.orders.all === "function"
    ? queryKeys.orders.all()
    : queryKeys.orders.all;
const foodsKey =
  typeof queryKeys.foods.all === "function"
    ? queryKeys.foods.all()
    : queryKeys.foods.all;

/* ---------------------------------- auth ---------------------------------- */

export function useLoginMutation(options = {}) {
  return useMutation({
    mutationFn: (credentials) =>
      api.post("/dunnkayce/login", { body: credentials }),
    ...options,
  });
}

export function useSignupMutation(options = {}) {
  return useMutation({
    mutationFn: (details) => api.post("/dunnkayce/signup", { body: details }),
    ...options,
  });
}

export function useAdminLoginMutation(options = {}) {
  return useMutation({
    mutationFn: (credentials) =>
      api.post("/admin/login", { body: credentials }),
    ...options,
  });
}

export function useAdminRegisterMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: (details) => api.post("/admin/register", { body: details }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.adminExists(),
      });
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

export function useChangePasswordMutation(options = {}) {
  return useMutation({
    mutationFn: (passwords) =>
      api.put("/dunnkayce/change-password", {
        body: passwords,
        auth: "user",
      }),
    ...options,
  });
}

/* --------------------------------- profile -------------------------------- */

export function useUpdateProfileMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: (payload) =>
      api.put("/dunnkayce/profile", { body: payload, auth: "user" }),
    onSuccess: async (data, variables, context) => {
      if (data?.user !== undefined) {
        queryClient.setQueryData(queryKeys.profile.current(), data.user);
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile.all(),
      });
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

/* ---------------------------------- cart ---------------------------------- */

function useCartMutationConfig(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.carts() }),
      ]);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

export function useAddToCartMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) => api.post("/cart/add", { body: payload, auth: "user" }),
    ...useCartMutationConfig(options),
  });
}

export function useUpdateCartQtyMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) =>
      api.put("/cart/updatecartqty", { body: payload, auth: "user" }),
    ...useCartMutationConfig(options),
  });
}

export function useRemoveFromCartMutation(options = {}) {
  return useMutation({
    mutationFn: (cartId) =>
      api.delete(`/cart/removefromcart/${encodeURIComponent(cartId)}`, {
        auth: "user",
      }),
    ...useCartMutationConfig(options),
  });
}

/* -------------------------------- checkout -------------------------------- */

function useOrderMutationConfig(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, invalidateCart = true, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: ordersKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.carts() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.dashboardStats(),
        }),
      ];
      if (invalidateCart) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() }),
        );
      }
      await Promise.all(invalidations);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

export function useCreateOrderMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) => api.post("/orders/create", { body: payload }),
    ...useOrderMutationConfig(options),
  });
}

export function useInitializePaymentMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) =>
      api.post("/cart/initialize-payment", { body: payload }),
    ...useOrderMutationConfig(options),
  });
}

/* ---------------------------------- food ---------------------------------- */

function useFoodMutationConfig(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      // Put the server's saved food into cache immediately so an edited image
      // appears at once instead of waiting for the invalidation refetch.
      const savedFood = data?.food;
      if (savedFood) {
        queryClient.setQueryData(foodsKey, (previous = []) => {
          const current = Array.isArray(previous) ? previous : [];
          const savedId = savedFood?._id ?? savedFood?.id;
          const index = current.findIndex(
            (food) => (food?._id ?? food?.id) === savedId,
          );
          if (index === -1) return [savedFood, ...current];
          const next = [...current];
          next[index] = { ...next[index], ...savedFood };
          return next;
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: foodsKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.carts() }),
      ]);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

export function useCreateFoodMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) => api.post("/food", { body: payload, auth: "admin" }),
    ...useFoodMutationConfig(options),
  });
}

export function useUpdateFoodMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      api.put(`/food/${encodeURIComponent(id)}`, {
        body: payload,
        auth: "admin",
      }),
    ...useFoodMutationConfig(options),
  });
}

export function useDeleteFoodMutation(options = {}) {
  return useMutation({
    mutationFn: (id) =>
      api.delete(`/food/${encodeURIComponent(id)}`, { auth: "admin" }),
    ...useFoodMutationConfig(options),
  });
}

/* -------------------------------- settings -------------------------------- */

export function useToggleRushHourMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: (payload = {}) =>
      api.patch("/settings/rush-hour", { body: payload, auth: "admin" }),
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(
        queryKeys.settings.rushHour(),
        Boolean(data?.rushHour),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.rushHour(),
      });
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

/* --------------------------------- admin ---------------------------------- */

export function useUpdateOrderStatusMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ id, status }) =>
      api.put(`/orders/${encodeURIComponent(id)}/status`, {
        body: { status },
        auth: "admin",
      }),
    onSuccess: async (data, variables, context) => {
      const returnedOrder = data?.order;
      queryClient.setQueryData(queryKeys.admin.orders(), (orders = []) => {
        if (!Array.isArray(orders)) return orders;
        const matches = (order) => {
          if (order?._id != null && order._id === variables.id) return true;
          if (order?.id != null && order.id === variables.id) return true;
          if (!returnedOrder) return false;
          if (order?._id != null && returnedOrder._id != null && order._id === returnedOrder._id) {
            return true;
          }
          return order?.id != null && returnedOrder.id != null && order.id === returnedOrder.id;
        };
        return orders.map((order) => {
          if (!matches(order)) return order;
          return returnedOrder
            ? { ...order, ...returnedOrder }
            : { ...order, status: variables.status };
        });
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.dashboardStats(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() }),
      ]);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

/* --------------------------- admin accounts --------------------------- */

function useAdminAccountsMutationConfig(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.admins() });
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

/**
 * Super Admin only. Creates a regular admin — no role field is ever sent from
 * the client, so privilege assignment stays server-side.
 */
export function useCreateAdminAccountMutation(options = {}) {
  return useMutation({
    mutationFn: (payload) =>
      api.post("/admin/admins", { body: payload, auth: "admin" }),
    ...useAdminAccountsMutationConfig(options),
  });
}

export function useUpdateAdminAccountMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      api.patch(`/admin/admins/${encodeURIComponent(id)}`, {
        body: payload,
        auth: "admin",
      }),
    ...useAdminAccountsMutationConfig(options),
  });
}

export function useRemoveAdminAccountMutation(options = {}) {
  return useMutation({
    mutationFn: (id) =>
      api.delete(`/admin/admins/${encodeURIComponent(id)}`, { auth: "admin" }),
    ...useAdminAccountsMutationConfig(options),
  });
}

/* -------------------------------- superadmin ------------------------------- */

function useSuperadminActivationMutationConfig(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.superadmin.status(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.superadmin.me() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.admins() }),
      ]);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

/** Shared invalidation config for the Super Admin admin-management mutations. */
function useSuperadminAdminMutationConfig(options = {}, { includeMe = false } = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return {
    onSuccess: async (data, variables, context) => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.superadmin.admins(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.admins() }),
      ];
      if (includeMe) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.superadmin.me() }));
      }
      await Promise.all(invalidations);
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  };
}

/** Activate the current admin as the single Super Admin using the server key. */
export function useActivateSuperadminMutation(options = {}) {
  return useMutation({
    mutationFn: ({ activationKey }) =>
      api.post("/api/superadmin/activate", {
        body: { activationKey },
        auth: "admin",
      }),
    ...useSuperadminActivationMutationConfig(options),
  });
}

/** Create a regular admin — the role is always assigned server-side. */
export function useCreateSuperadminAdminMutation(options = {}) {
  return useMutation({
    mutationFn: ({ username, email, password }) =>
      api.post("/api/superadmin/admins", {
        body: { username, email, password },
        auth: "admin",
      }),
    ...useSuperadminAdminMutationConfig(options),
  });
}

/** Set an admin's status with either a string status or an isActive boolean. */
export function useSetSuperadminAdminStatusMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id, status, isActive }) => {
      const body = status !== undefined ? { status } : { isActive };
      return api.patch(`/api/superadmin/admins/${encodeURIComponent(id)}/status`, {
        body,
        auth: "admin",
      });
    },
    ...useSuperadminAdminMutationConfig(options, { includeMe: true }),
  });
}

/** Block an admin and revoke their active sessions server-side. */
export function useBlockSuperadminAdminMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id, reason }) =>
      api.patch(`/api/superadmin/admins/${encodeURIComponent(id)}/block`, {
        body: reason !== undefined && reason !== null ? { reason } : undefined,
        auth: "admin",
      }),
    ...useSuperadminAdminMutationConfig(options, { includeMe: true }),
  });
}

/** Unblock an admin, restoring the active status without elevating their role. */
export function useUnblockSuperadminAdminMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id }) =>
      api.patch(`/api/superadmin/admins/${encodeURIComponent(id)}/unblock`, {
        auth: "admin",
      }),
    ...useSuperadminAdminMutationConfig(options, { includeMe: true }),
  });
}

/** Permanently remove a managed admin. */
export function useRemoveSuperadminAdminMutation(options = {}) {
  return useMutation({
    mutationFn: ({ id }) =>
      api.delete(`/api/superadmin/admins/${encodeURIComponent(id)}`, {
        auth: "admin",
      }),
    ...useSuperadminAdminMutationConfig(options),
  });
}
