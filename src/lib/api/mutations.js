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

/**
 * NOTE: `PUT /orders/:id/status` is currently commented out in NewDun_BE
 * (Routes/order.routes.js). The call is kept so the UI keeps its existing
 * behavior; it will surface the backend 404 as a mutation error.
 */
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
      queryClient.setQueryData(queryKeys.admin.orders(), (orders = []) =>
        orders.map((order) =>
          order._id === variables.id ? { ...order, status: variables.status } : order,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
