# Server state / API layer (TanStack Query migration)

All backend calls go through this folder. Components should **not** call `fetch(BASE + ...)` directly; use a hook from `@/lib/api`.

## 1. Architecture

- `getRouter()` in `src/router.jsx` creates **one** `QueryClient` per router and passes it in router context (`context: { queryClient }`). Defaults:
  - queries: `staleTime: 15_000`, `gcTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: false`
  - mutations: `retry: 0`
- `src/routes/__root.jsx` reads that client from `Route.useRouteContext()` and wraps the app in `<QueryClientProvider client={queryClient}>`.
- One HTTP client: `apiFetch()` (`client.js`) + `api.get/post/put/patch/delete` helpers. `API_BASE_URL` comes from `import.meta.env.VITE_API_URL`, falling back to `https://dunkacyce-backend.onrender.com` (trailing slashes stripped).
- Auth headers: `auth: false` (default) sends none; `auth: true` / `"user"` sends the user JWT from `sessionStorage.token` or `localStorage.authToken`; `auth: "admin"` sends `sessionStorage.adminToken`.
- Plain object bodies are JSON-stringified with `Content-Type: application/json`; `FormData`, strings and `Blob` are passed through. Responses are parsed as JSON when possible; non-2xx throws `ApiError` with `.status` and `.payload` (message is `payload.message` / `payload.error`).
- Query keys are centralized in `keys.js`; reads live in `queries.js`, writes in `mutations.js`. React Query v5 has no query-level `onError`, so components watch `error` from the query and toast in an effect.
- Socket events in `user-dashboard.jsx` update the `["foods"]` cache directly via `queryClient.setQueryData(queryKeys.foods.all(), ...)`.

## 2. File map

| File | Responsibility |
| --- | --- |
| `client.js` | `apiFetch`, `api` method helpers, `API_BASE_URL`, `getToken`, `ApiError` |
| `keys.js` | `queryKeys` factory — the only source of cache keys |
| `queries.js` | Read hooks (`useQuery`) + response normalization (`data?.foods ?? []`, `data?.cart ?? []`, etc.) |
| `mutations.js` | Write hooks (`useMutation`) + cache invalidation / optimistic `setQueryData` |
| `index.js` | Barrel: re-exports all four modules; import from `@/lib/api` |

## 3. Hooks reference

### Queries

| Hook | Endpoint | `data` shape | Cache key |
| --- | --- | --- | --- |
| `useFoodsQuery(options)` | `GET /food` | `Food[]` (`data.foods`, default `[]`) | `["foods"]` |
| `useRushHourQuery(options)` | `GET /settings/rush-hour` | `boolean` (`data.rushHour`) | `["settings","rush-hour"]` |
| `useCurrentUserCartQuery(options)` | `GET /cart/getusercart` (user JWT) | `CartItem[]` (`data.cart`, default `[]`); disabled until a user token exists | `["cart","current"]` |
| `useUserOrdersQuery(userId, options)` | `GET /orders/user/:userId` | `Order[]` (`data.orders`); disabled without `userId` | `["orders","user",userId]` |
| `usePaymentHistoryQuery(userId, options)` | `GET /orders/user/:userId/receipts` | receipt `Order[]` (`data.orders`); disabled without `userId` | `["orders","receipts",userId]` |
| `useProfileQuery(options)` | `GET /dunnkayce/profile` (user JWT) | current user profile (`data.user`, default `null`); disabled until a user token exists | `["profile","current"]` |
| `useAdminExistsQuery(options)` | `GET /admin/exists` | `boolean` (`data.exists`) | `["auth","admin","exists"]` |
| `useAdminDashboardStatsQuery(options)` | `GET /admin/dashboard-stats` | `{ totalStudents, totalOrders, weeklyRevenue, paidStudents, studentsToDelivery }` (missing fields default to `0`) | `["admin","dashboard-stats"]` |
| `useAdminOrdersQuery(options)` | `GET /admin/getorders` | `Order[]` (`data.orders`) | `["admin","orders"]` |
| `useAdminCartsQuery(options)` | `GET /admin/carts` | `Cart[]` (`data.carts`) | `["admin","carts"]` |

All hooks accept React Query options and spread them last (so `staleTime`, `refetchInterval`, etc. can be overridden). `useFoodsQuery` / `useRushHourQuery` default to `staleTime: 10_000`; `user-dashboard.jsx` passes `refetchInterval: 5000` to both.

### Mutations

| Hook | Endpoint / auth | Payload (variables) | Invalidates on success |
| --- | --- | --- | --- |
| `useLoginMutation` | `POST /dunnkayce/login` | `{ email, password }` | — |
| `useSignupMutation` | `POST /dunnkayce/signup` | `{ fullName, phone, gender, email, password }` | — |
| `useAdminLoginMutation` | `POST /admin/login` | `{ email, password }` | — |
| `useAdminRegisterMutation` | `POST /admin/register` | `{ email, username, password }` | — |
| `useChangePasswordMutation` | `PUT /dunnkayce/change-password` (user) | `{ oldPassword, newPassword }` | — |
| `useUpdateProfileMutation` | `PUT /dunnkayce/profile` (user) | profile payload (`FormData` for image upload, or JSON with `fullName,email,phone,gender`) | `setQueryData` from `data.user` when present, then invalidates `profile.all` |
| `useAddToCartMutation` | `POST /cart/add` (user) | `{ foodId, quantity }` | `cart.current`, `admin.carts` |
| `useUpdateCartQtyMutation` | `PUT /cart/updatecartqty` (user) | `{ cartId, quantity }` | `cart.current`, `admin.carts` |
| `useRemoveFromCartMutation` | `DELETE /cart/removefromcart/:cartId` (user) | `cartId` (string) | `cart.current`, `admin.carts` |
| `useCreateOrderMutation` | `POST /orders/create` | `{ userId, items: [{ foodId, name, price, qty, soupType }], hostel, room, total, paymentMethod }` → response includes `reference` | `orders.all`, `cart.current`, `admin.carts`, `admin.dashboardStats` |
| `useInitializePaymentMutation` | `POST /cart/initialize-payment` | `{ email, amount, reference }` → response includes `authorization_url` | same as `orders.all` group above |
| `useCreateFoodMutation` | `POST /food` (admin) | `FormData` (image upload) or `{ name, price, category, imageUrl, status, isSwallow, dailyLimit }` | `foods.all`, `admin.carts` |
| `useUpdateFoodMutation` | `PUT /food/:id` (admin) | `{ id, payload }` (`payload` = form object or `FormData`) | `foods.all`, `admin.carts` |
| `useDeleteFoodMutation` | `DELETE /food/:id` (admin) | `id` (string) | `foods.all`, `admin.carts` |
| `useToggleRushHourMutation` | `PATCH /settings/rush-hour` (admin) | defaults to `{}`; dashboard sends `{ status: true }` | `setQueryData` from `data.rushHour`, then invalidates `settings.rushHour` |
| `useUpdateOrderStatusMutation` | `PUT /orders/:id/status` (admin) | `{ id, status }` | `setQueryData` patches matching `_id`, then invalidates `admin.orders` |

Invalidation uses the shared helper configs `useCartMutationConfig`, `useOrderMutationConfig`, `useFoodMutationConfig`; caller-supplied `onSuccess` runs **after** invalidation. Prefix invalidation means `["orders"]` also refreshes `["orders","user",id]` and `["orders","receipts",id]`.

## 4. Query key reference (`queryKeys`)

| Accessor | Key |
| --- | --- |
| `queryKeys.auth.all` | `["auth"]` |
| `queryKeys.auth.adminExists()` | `["auth","admin","exists"]` |
| `queryKeys.profile.all()` | `["profile"]` |
| `queryKeys.profile.current()` | `["profile","current"]` |
| `queryKeys.foods.all()` | `["foods"]` |
| `queryKeys.cart.all()` | `["cart"]` |
| `queryKeys.cart.current()` | `["cart","current"]` |
| `queryKeys.orders.all()` | `["orders"]` |
| `queryKeys.orders.user(userId)` | `["orders","user",userId]` |
| `queryKeys.orders.receipts(userId)` | `["orders","receipts",userId]` |
| `queryKeys.admin.all()` | `["admin"]` |
| `queryKeys.admin.dashboardStats()` | `["admin","dashboard-stats"]` |
| `queryKeys.admin.orders()` | `["admin","orders"]` |
| `queryKeys.admin.carts()` | `["admin","carts"]` |
| `queryKeys.settings.all()` | `["settings"]` |
| `queryKeys.settings.rushHour()` | `["settings","rush-hour"]` |

## 5. Migration map (what each route used to call → now)

| Route file | Before | Now |
| --- | --- | --- |
| `src/routes/login.jsx` | `POST /dunnkayce/login` | `useLoginMutation` |
| `src/routes/signup.jsx` | `POST /dunnkayce/signup` | `useSignupMutation` |
| `src/routes/adminlogin.jsx` | `GET /admin/exists`, `POST /admin/register`, `POST /admin/login` | `useAdminExistsQuery`, `useAdminRegisterMutation`, `useAdminLoginMutation` |
| `src/routes/change-password.jsx` | `PUT /dunnkayce/change-password` | `useChangePasswordMutation` |
| `src/routes/user-dashboard.jsx` | `GET /food` (polled + socket refetch), `GET /settings/rush-hour`, `POST /cart/add` | `useFoodsQuery({ refetchInterval: 5000 })`, `useRushHourQuery(...)`, `useAddToCartMutation`; socket events write `queryKeys.foods.all()` |
| `src/routes/cart.jsx` | `GET /cart/getusercart`, `PUT /cart/updatecartqty`, `DELETE /cart/removefromcart/:id` | `useCurrentUserCartQuery`, `useUpdateCartQtyMutation`, `useRemoveFromCartMutation` |
| `src/routes/checkout.jsx` | `GET /cart/getusercart`, `POST /orders/create`, `POST /cart/initialize-payment` | `useCurrentUserCartQuery`, `useCreateOrderMutation`, `useInitializePaymentMutation` |
| `src/routes/orders.jsx` | `GET /orders/user/:id` | `useUserOrdersQuery(user.id)` |
| `src/routes/payments.jsx` | `GET /orders/user/:id/receipts` | `usePaymentHistoryQuery(user.id)` |
| `src/routes/admin-dashboard.jsx` | `GET /admin/dashboard-stats`, `GET` + `PATCH /settings/rush-hour` | `useAdminDashboardStatsQuery`, `useRushHourQuery`, `useToggleRushHourMutation` |
| `src/routes/admin-dashboard-food-management.jsx` | `GET /food`, `POST /food`, `PUT /food/:id`, `DELETE /food/:id` | `useFoodsQuery`, `useCreateFoodMutation`, `useUpdateFoodMutation`, `useDeleteFoodMutation` |
| `src/routes/admin-dashboard-order-management.jsx` | `GET /admin/getorders`, `PUT /orders/:id/status` | `useAdminOrdersQuery`, `useUpdateOrderStatusMutation` |
| `src/routes/admin-dashboard-student-cart.jsx` | `GET /admin/carts` | `useAdminCartsQuery` |
| `src/routes/index.jsx` | Supabase `app_settings` query (`useQuery(["settings"])`) | Removed; landing page no longer fetches settings |
| `src/routes/profile.jsx` | No HTTP call (session/sync fix in this migration) | Uses `getSessionUser()` / `store`; no API hook |

`src/routes/admin-dashboard-change-password.jsx` is still a static placeholder (see caveats). `src/router.jsx` and `src/routes/__root.jsx` own the QueryClient setup described in §1.

## 6. Known backend gaps / caveats

- **Signup returns no token.** `signup.jsx` checks `data.token ?? data.accessToken` and `data.user ?? data.admin`; until the backend returns both, no authenticated session is created after signup (the user lands on `/` signed out).
- **`/admin/dashboard-change-password` has no backend endpoint.** `admin-dashboard-change-password.jsx` is a placeholder form with no submit handler; only the user-facing `/change-password` page is wired.
- **`PATCH /settings/rush-hour` toggles server-side and ignores the request body.** The dashboard passes `{ status: true }`, but the resulting state comes from the response's `rushHour` — do not treat the sent value as authoritative.
- **All admin user routes are unauthenticated on the backend**, despite `client.js` attaching the admin JWT (`sessionStorage.adminToken`). Route-level auth checks in the frontend are UI guards only.

All `queryKeys` entries are factory functions (including `foods.all()` and `orders.all()`), so they can be passed directly to `useQuery`, `setQueryData` and `invalidateQueries`.

## 7. Adding a new query or mutation

1. **Add a key** in `src/lib/api/keys.js` (e.g. `orders.byId: (id) => ["orders", "by-id", id]`). Never hardcode a key in a component.
2. **Add the hook** in `queries.js` (`useQuery` + normalization via `api.get(...)`) or `mutations.js` (`useMutation` + `api.post/put/patch/delete`, then invalidate the relevant keys via `useQueryClient()`). Reuse/extend the shared invalidation configs where sensible.
3. **Consume it** in the route via `import { ... } from "@/lib/api"`, using `data / isPending / error` (and `mutateAsync` for writes). `index.js` re-exports everything automatically; no other wiring needed.

## 8. Verification commands

PowerShell may block `npm.ps1` under execution policy — use the `.cmd` shims:

```powershell
npm.cmd run build
npm.cmd run lint
npx.cmd prettier --check src/lib/api/*.js src/router.jsx src/routes/__root.jsx
```

Notes: `npm.cmd run lint` uses ESLint config restricted to `**/*.{ts,tsx}`, so `.js`/`.jsx` files (including this folder) are **not** linted — the build and Prettier check are the useful checks for them.
