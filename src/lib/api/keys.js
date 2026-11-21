/** Centralized query-key factory. All query and invalidation calls use this. */
export const queryKeys = {
  auth: {
    all: () => ["auth"],
    adminExists: () => ["auth", "admin", "exists"],
  },
  profile: {
    all: () => ["profile"],
    current: () => ["profile", "current"],
  },
  foods: {
    all: () => ["foods"],
  },
  cart: {
    all: () => ["cart"],
    current: () => ["cart", "current"],
  },
  orders: {
    all: () => ["orders"],
    user: (userId) => ["orders", "user", userId],
    receipts: (userId) => ["orders", "receipts", userId],
  },
  admin: {
    all: () => ["admin"],
    dashboardStats: () => ["admin", "dashboard-stats"],
    orders: () => ["admin", "orders"],
    carts: () => ["admin", "carts"],
  },
  settings: {
    all: () => ["settings"],
    rushHour: () => ["settings", "rush-hour"],
  },
};
