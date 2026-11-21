# Admin Portal — Dunnkayce (Swift Campus Feast)

Documentation and audit record for the admin-facing part of the frontend. Last audited **2026-11-21** against the files under `src/routes/admin*.jsx`, `src/components/Admin*.jsx`, and the supporting `src/lib/*` layer. Super Admin rollout notes were added the same day.

> **Read this first:** the backend now enforces `verifyAdmin` on every admin data endpoint and `verifySuperAdmin` on every admin-management endpoint. Frontend route guards are still **UX convenience, not security** — the server is authoritative for roles, statuses and session revocation. Regular admins get `403` from management endpoints; blocked/inactive admins get `401` and are signed out.

---

## 0. 2026 Visual redesign (implementation record — 2026-11-21)

A visual-only pass over the admin surface (deep forest / fresh green / off-white / gold, a working light/dark/system theme, a shared component kit, curated food photography and responsive layouts). This is a record of what was implemented; the audit findings in §6 (S1–S8, F1–F12) and the backend gaps in §7 remain open unless explicitly noted below.

| Area | What changed |
| --- | --- |
| Tokens | `src/styles.css` keeps every existing token name and adds forest/fresh/gold/surface aliases, a full `.dark` token block, `@custom-variant dark`, the `dk-spin` / `dk-float` / `dk-shimmer` / `dk-pulse-soft` keyframes and `.admin-panel`, `.admin-eyebrow`, `.admin-focus`, `.preview-stripe` helpers. |
| Theme controller | `src/lib/theme.jsx` exports `ThemeProvider` and `useTheme()` → `{ theme, setTheme, toggleTheme, resolvedTheme }` (`light` / `dark` / `system`). Mounted in `src/routes/__root.jsx` around `QueryClientProvider`; preference persisted in `localStorage["dunnkayce-theme"]`. |
| No theme flash | A pre-paint inline script in `index.html` reads `dunnkayce-theme` / `prefers-color-scheme` and applies `.dark` + `color-scheme` before CSS paints; the broken `/vite.svg` favicon was replaced with an inline forest-green SVG data URI. |
| Theme toggle | `ThemeToggle` appears in the `AdminNavbar` desktop sidebar, mobile bar and drawer; the themed `src/components/ui/sonner.jsx` wrapper is mounted with `resolvedTheme` and `position="top-center"`. |
| Shared kit | New `src/components/admin/` (barrel `src/components/admin/index.js`) exports `AdminPanel`, `SectionHeading`, `StatCard`, `StatusPill`, `SearchField`, `FilterSelect`, `RefreshButton`, `EmptyState`, `ErrorState`, `LoadingBlock`, `FoodImage`, `ThemeToggle`, `PreviewBadge`, `PreviewBanner`, `PageHeader`, plus shared `toneClasses` / `TONE_NAMES` / `resolveTone`. Presentational only: no data fetching, API hooks or router navigation. |
| Food imagery | `src/lib/foodImages.js` exports `FOOD_PHOTOS` (stable Unsplash URLs by category), `FOOD_HIGHLIGHTS`, `getFoodPhoto()` (deterministic fallback by name) and `FOOD_FALLBACK_SVG` (local plate illustration). `FoodImage` uses fixed `aspect-[4/3]` frames, `loading="lazy"`, `referrerPolicy="no-referrer"` and a one-shot local fallback — no remote placeholder service. |
| Pages / chrome | Restyled: `admin.jsx`, `adminlogin.jsx`, `admin-dashboard.jsx`, the Users page, food management, order management, student cart, change-password and all five hidden previews; `AdminShell`, `AdminNavbar` and `DunnkayceLoader` carry the forest/gold chrome. Layouts are responsive from a 360px mobile drawer through tablet to the desktop sidebar/table. |

Intentional behavior/UX changes (visual scope only):

- **Order status endpoint:** `PUT /orders/:id/status` now exists in the backend and is guarded by `verifyAdmin`; the earlier "Status updates unavailable — backend endpoint not deployed" hint is obsolete. `useUpdateOrderStatusMutation` calls it with `auth: "admin"`.
- **Explicit error states:** orders, carts, users, food management and dashboard now render `ErrorState` with the existing `refetch()` instead of falling through to an empty state (the UI side of F8 only). Change-password and all hidden previews remain non-functional previews with `noindex, nofollow` meta, disabled/mock controls and no sidebar links.
- **Small UI/accessibility changes:** Escape-to-close and `inert` on the closed mobile drawer, dialog focus handling, `noopener,noreferrer` on the support link, `role="status"` / `aria-live` skeletons, `_id ?? id`-style normalization and local image fallbacks. These are presentation/keyboard fixes and **do not close S1–S8**, F1–F6 or F9–F12.
- **Preserved:** every route path and `createFileRoute` call, all hooks, query keys and API endpoints, toast/filter/sort/form-payload behavior, session writes, and all uncommitted user work (notably the Users page/query/key, socket env change, `client.js` error sanitization and the `disconnectAdminSocket()` logout call). No new backend endpoint was added.
- **Verification:** `npm.cmd run build` passes (Vite 7; only the pre-existing chunk-size warning).
- **Reference:** no visual reference image was present in the workspace; the redesign followed the written brief and `DESIGN_SYSTEM.md`.

### 0.1 Multi-admin / Super Admin (implemented 2026-11-21)

- Canonical role is `superadmin` (the frontend also accepts the legacy `super_admin` alias). Exactly one is enforced by a MongoDB unique partial index; regular `admin` accounts can use all dashboard/management features but get `403` from admin-management endpoints. Full contract: `ADMIN_ACCOUNTS.md`; setup steps: `SUPER_ADMIN_SETUP.md`.
- The first `/admin/register` call is public only while zero admins exist (optional backend `ADMIN_BOOTSTRAP_KEY`) and creates a **regular `admin`**, not a Super Admin. The designated admin logs in and calls `POST /api/superadmin/activate` with the backend-only `SUPER_ADMIN_ACTIVATION_KEY`. Activation keeps the current session valid; the frontend re-persists the returned role and middleware reads the role from the DB on every request.
- `src/lib/adminSession.js` normalises the backend-provided role and `adminlogin.jsx` persists it with the session. The old behavior that marked the first setup account as `super_admin` in `localStorage` is removed.
- `AdminNavbar` shows exactly one `superOnly` item — **Super Admin** (`Crown` icon) — to Super Admins only, plus a role pill. `/admin-dashboard-superadmin.jsx` is the dedicated management page with a `beforeLoad` redirect to `/admin-dashboard` for non-Super Admins; `/admin-dashboard-admins` is now a redirect alias.
- The page lists/creates/activates/deactivates/blocks/unblocks/removes admins through the `useSuperadmin*Query` / `useSuperadmin*Mutation` hooks in `@/lib/api` against the live `/api/superadmin` endpoints (`/admin/admins` aliases also exist). No data is mocked.
- `vite.config.js` registers `tanstackRouter()`, so `src/routeTree.gen.ts` regenerates on build/dev instead of silently going stale.

---

## 1. Quick start

```powershell
npm.cmd install
npm.cmd run dev            # Vite dev server on http://localhost:5173
```

- Admin entry point: `/admin` (redirect stub) → `/adminlogin`.
- After login the app navigates to `/admin-dashboard`.
- Backend base URL: `VITE_API_URL` (public, baked into the bundle). Falls back to `https://dunkacyce-backend.onrender.com`. The backend must allow the app origin and the `Authorization` header via CORS; there is no dev proxy in `vite.config.js`.
- Useful checks: `npm.cmd run build`, `npm.cmd run lint`, `npx.cmd prettier --check src/**/*.jsx`.

---

## 2. Route map

All admin routes are **flat children of `__root`** in `src/routeTree.gen.ts` (auto-generated — do not hand-edit). They are *not* nested under `/admin`; `/admin` is just another sibling route.

| Path | File | Status | Nav link | Data |
| --- | --- | --- | --- | --- |
| `/admin` | `admin.jsx` | Active — redirect stub | No | Reads `sessionStorage` |
| `/adminlogin` | `adminlogin.jsx` | Active — login + first-admin setup | No | `admin/exists`, `admin/register`, `admin/login` |
| `/admin-dashboard` | `admin-dashboard.jsx` | Active — overview | Yes | Dashboard stats, rush hour |
| `/admin-dashboard-users` | `admin-dashboard-users.jsx` | Active — registered user directory | Yes | `admin/users` |
| `/admin-dashboard-food-management` | `admin-dashboard-food-management.jsx` | Active — full CRUD | Yes | `GET/POST/PUT/DELETE /food` |
| `/admin-dashboard-order-management` | `admin-dashboard-order-management.jsx` | Active — paid orders | Yes | `admin/getorders`, `orders/:id/status` |
| `/admin-dashboard-student-cart` | `admin-dashboard-student-cart.jsx` | Active — read-only carts | Yes | `admin/carts` |
| `/admin-dashboard-change-password` | `admin-dashboard-change-password.jsx` | **Preview only** — disabled form | Yes | None |
| `/admin-dashboard-superadmin` | `admin-dashboard-superadmin.jsx` | Active — **Super Admin only** (`beforeLoad` guard) | Yes (Super Admin only) | `/api/superadmin/admins`, `/status`, `/me` |
| `/admin-dashboard-admins` | `admin-dashboard-admins.jsx` | **Redirect alias** → `/admin-dashboard-superadmin` | No | None |
| `/admin-dashboard-image-upload` | `admin-dashboard-image-upload.jsx` | **Hidden preview** | Commented out | None |
| `/admin-dashboard-payment-tracking` | `admin-dashboard-payment-tracking.jsx` | **Hidden preview** | Commented out | None |
| `/admin-dashboard-user-analytics` | `admin-dashboard-user-analytics.jsx` | **Hidden preview** | Commented out | None |
| `/admin-dashboard-delivery-management` | `admin-dashboard-delivery-management.jsx` | **Hidden preview** | Commented out | None |
| `/admin-dashboard-system-settings` | `admin-dashboard-system-settings.jsx` | **Hidden preview** | Commented out | None |

Deep links work only because of the Vercel SPA catch-all rewrite in `vercel.json` (`/(.*) → /index.html`).

---

## 3. Architecture

```
/admin  ──(session check)──►  /admin-dashboard  or  /adminlogin
                                    │
                          AdminShell (header)
                                    │
                        AdminNavbar (sidebar / drawer)
                                    │
                     ┌──────────────┼───────────────┐
                Dashboard     Food Mgmt      Orders / Carts / previews
                     │
             @/lib/api hooks ──► src/lib/api/client.js ──► backend
```

- **`AdminShell`** (`src/components/AdminShell.jsx`) — page layout wrapper. Props: `eyebrow`, `title`, `description`, `actions`, `children`, `className`. Renders an optional header then passes everything into `AdminNavbar`. Every `/admin-dashboard*` page should use it.
- **`AdminNavbar`** (`src/components/AdminNavbar.jsx`) — owns all admin chrome: fixed desktop sidebar (`lg`, ≥1024px), mobile top bar, off-canvas drawer, support/logout actions. Source of truth for links is `adminNavItems` at lines 9–21, rendered twice (desktop 150–178, mobile 273–302). **Adding a route requires adding an item AND importing its icon at line 3** — the commented-out entries reference icons that are not imported and will break the build if uncommented as-is.
- Chrome is shown only when `pathname.startsWith("/admin-dashboard")` (`AdminNavbar.jsx:99-101`). A future route not named `/admin-dashboard*` silently loses navigation; a prefix like `/administration` would wrongly gain it.
- Sidebar collapse preference is persisted in `localStorage.adminDesktopSidebarOpen`; it survives logout.

### Session contract

| Concern | Current behavior |
| --- | --- |
| Admin token | `sessionStorage.adminToken`, written by `persistAdminSession()` in `adminlogin.jsx` from `data.token ?? data.accessToken`. Login now fails if the response has no token (previously `""` was stored as a "valid" session). |
| Admin identity | `sessionStorage.admin` — JSON string of `data.admin ?? data.user ?? data`; role normalised by `src/lib/adminSession.js` (`role` / `adminRole` / `isSuperAdmin`, etc.) |
| User session (shared) | `sessionStorage.token` / `sessionStorage.user` + legacy `localStorage.authToken` |
| API auth header | `client.js:23-30` — `auth: "admin"` reads `sessionStorage.adminToken`; all admin reads and writes pass it as a Bearer token (the old "admin GETs send no header" note is obsolete) |
| Admin socket | `getAdminSocket()` in `src/lib/socket.js` creates a singleton authenticated with the current `adminToken`; used by order management and `AdminPaymentNotifier` |
| Expiry / refresh | None. No `exp` decode, no 401 interception, no refresh token |
| Logout | `AdminNavbar.jsx` `handleLogout`: calls `disconnectAdminSocket()`, removes the two admin keys, `store.logout()`, `clearSession()`, `queryClient.clear()`, navigates to `/adminlogin` |

`clearSession()` (`src/lib/session.js:44-50`) also removes `user`/`token` but **not** `localStorage.authToken`, which `src/routes/__root.jsx:56-69` rehydrates on load — so a stale user token can come back after admin logout. Admin logout also clears the student cart (`store.logout()`), i.e. it is a full cross-surface logout.

---

## 4. Page reference

### 4.1 `/admin` — entry stub
Reads `adminToken` + `admin`; considers a session valid if both are truthy and `JSON.parse(stored)` succeeds, then redirects with `replace: true`. No token shape or expiry validation — `JSON.parse("null")` counts as authenticated. Redirect does not clear stale keys.

### 4.2 `/adminlogin` — login / first-admin setup
- `useAdminExistsQuery()` decides mode. No admin → registration form (`username`, `email`, `password`); admin exists → login form (`email`, `password`).
- On query error it toasts "Network unstable" and, after 800 ms, **forces login mode**, making first-time setup impossible during a transient outage.
- Success stores token/admin via `persistAdminSession()` (including the backend-provided role) and redirects to `/admin-dashboard`. First-admin setup creates a **regular `admin`** — it is no longer marked `super_admin` locally; activation is a separate step (`SUPER_ADMIN_SETUP.md`).
- All feedback is via `sonner` toasts; no inline field errors. `noValidate` + non-empty-only checks mean malformed emails/weak passwords go straight to the API.
- After registration the shared form state is not cleared, so the chosen password is pre-filled into the login form.
- Missing token now fails login with a toast instead of storing `""` — the old inconsistent-state issue is fixed.
- The registration form is public only while zero admins exist; the backend also honours the optional `ADMIN_BOOTSTRAP_KEY` during that window. Once an admin exists, `/admin/register` is closed.

### 4.3 `/admin-dashboard` — overview
- Hooks: `useAdminDashboardStatsQuery`, `useRushHourQuery`, `useToggleRushHourMutation`.
- An inline `useEffect` guard redirects to login when the session keys are missing/unparseable; the page shows `DunnkayceLoader` while checking. All three hooks fire **before** the guard, so requests without a valid admin token can be issued on cold load (now rejected with `401` by `verifyAdmin`).
- KPI cards: Students, Orders, Weekly Revenue, and a conditional Avg. Order Value.
  - **Math caveat:** AOV = `weeklyRevenue / totalOrders`, i.e. weekly revenue divided by *all-time* orders. It should use a weekly order count or be relabeled.
  - Values assume numeric fields; a partial response throws on `.toLocaleString()`.
  - Card count changes 3 → 4 when stats load, causing a grid layout shift.
- Rush-hour strip: status badge, `aria-pressed` toggle, retry on error. Toggle uses the query's `data === true` check (strict) and only the mutation's `isPending`; an in-flight refetch can make the intended value stale. There is no 401 handling — expired sessions just show "Status unavailable".
- Quick links: Food Management, Order Management, Student Cart, Change Password. The last one's copy implies a working feature, but that page is a disabled preview.

### 4.4 `/admin-dashboard-food-management` — catalog CRUD
- `useFoodsQuery()` (`GET /food`, 10 s stale time, public read) + create/update/delete mutations (admin JWT), which invalidate `["foods"]` and `["admin","carts"]`.
- Client-side search, category/status filters, derived stats (Total / Available / Preparing / Unavailable), and a modal create/edit form with image upload.
- Payload shape: `FormData` with `image` when a file is chosen, otherwise JSON with `imageUrl`. The FormData branch omits `imageUrl`, which may clear the stored URL on edit. Per-food daily order limits have been removed — users can order any quantity.
- Uses only `food._id` for keys and edit/delete IDs; other parts of the app normalize `_id ?? id`. Normalize here too.
- No route-level guard; expired/missing tokens surface as generic toasts rather than a redirect.
- Dialog has no Escape handler/focus trap; delete uses native `confirm()` and stays enabled during mutation. No MIME/size validation on uploads. Validation is toast-only with no inline errors. Images fall back to external `placehold.co`.

### 4.4a `/admin-dashboard-users` — registered users
- `GET /admin/users`, called with the admin Bearer token (`auth: "admin"` → `Authorization: Bearer <sessionStorage.adminToken>`); like every other admin data endpoint, it is gated server-side by `verifyAdmin` in `middleware/adminAuth.js` (agent B5). The old note that only this route was authenticated is obsolete.
- Response shape: `{ users: [...] }`; each record carries `_id`, `email`, `fullName`, `phone`, `gender`, `balance`, `profilePicture`, `createdAt`, `updatedAt`, plus computed `orderCount` and `totalPaid` (paid orders only, grouped by `userId`). Passwords are excluded via an explicit field whitelist. Missing `users` falls back to `[]`.
- `useAdminUsersQuery()` (`src/lib/api/queries.js`) wraps the call with cache key `["admin","users"]` (`queryKeys.admin.users()`). Manual refresh only — no polling or socket.
- UI: summary stats (total users, paid customers, total paid, wallet balance), client-side search by name/email/phone, gender filter and 5 sort modes; responsive table on desktop and stacked cards on mobile; avatar images with initials fallback. Explicit loading, error/retry and empty states.
- **Privacy:** this is a directory of real registered users (names, emails, phone numbers) — treat it as sensitive. Avoid screenshots/logs with live data until masking and a client-side route guard are in place.

### 4.5 `/admin-dashboard-order-management` — paid orders
- `useAdminOrdersQuery()` (`GET /admin/getorders`) and `useUpdateOrderStatusMutation()` (`PUT /orders/:id/status`). UI title is "Paid Orders"; only `paymentStatus === "Paid"` is shown.
- Search across ID/customer/delivery/payment fields, status filter, 4 sort modes, detail sheet with customer PII, per-order status `<select>` (disabled per-order while updating), manual refresh.
- **Backend:** `PUT /orders/:id/status` now exists and is guarded by `verifyAdmin`; the earlier "commented out / 404" note is obsolete. `useUpdateOrderStatusMutation` calls it with `auth: "admin"`.
- **Status-change evidence:** each per-order control must be unlocked before the status can change, and confirmation goes through an `AlertDialog` that shows the order, customer, old → new status, and explains the effect ("Ready" starts the student's arrival countdown; "Delivered" records the exact handoff time). The selected order is disabled while its mutation is pending. The earlier "no confirmation / status updates unavailable" notes are obsolete.
- **Tracking fields:** the detail sheet and order cards show `readyAt`, `deliveredAt` and an `etaMinutes` arrival estimate (default 8 minutes), normalized through `src/lib/orderTracking.js`. Legacy delivered orders without `deliveredAt` fall back to `updatedAt`.
- **Realtime:** `getAdminSocket()` subscribes (with cleanup on unmount) to `ORDER_STATUS_EVENTS` (`order_status_updated`, `order_ready`, `order_delivered`) and invalidates `["admin","orders"]`; there is no `refetchInterval`. `AdminPaymentNotifier` (mounted in `AdminShell`) listens for `payment_confirmed` / `payment:received`, shows a deduplicated toast plus an optional browser notification, and invalidates orders and dashboard stats. Carts are not invalidated by these events.
- A failed query renders the "No paid orders yet" empty state because errors are only toasted. No pagination. Full email/phone/room are shown unmasked.

### 4.6 `/admin-dashboard-student-cart` — cart monitoring
- `useAdminCartsQuery()` → `GET /admin/carts`, key `["admin","carts"]`. Manual refresh only — despite "Live Monitoring" copy, there is no polling or socket.
- Summary cards, client-side name/email search, 3 sort modes, expandable cart cards with line items. Read-only — no edit/delete/checkout actions.
- "Students with items" currently counts **cart records**, not distinct students. "Last updated"/"Most recent" use `createdAt`, not an update timestamp.
- Errors are toasted and then rendered as "No active student carts". Student names/emails are placed in the DOM unmasked; remote `imageUrl`s are loaded directly in the admin browser (leaks IP/referrer).
- This is a privacy-sensitive view — avoid screenshots/logs containing real student data until masking and authorization are fixed.

### 4.7 `/admin-dashboard-change-password` — disabled preview
Static, explicitly labeled "coming soon". Three password inputs inside a disabled `<fieldset>`, a disabled button, no validation, no mutation, no API call, no state. Remove the misleading quick-link copy or implement the endpoint (`POST /admin/change-password`) with current-password verification, complexity policy, rate limiting, then clear the session and redirect on success.

### 4.8 Hidden previews
`image-upload`, `payment-tracking`, `user-analytics`, `delivery-management`, and `system-settings` are fully registered routes with `AdminShell` but **commented out of the sidebar** and absent from quick links. They contain labeled mock data only (`mockAssets`, `sampleQueue`, `sampleStats`, `previewRoute`, `previewSettings`, etc.) and no API calls. Direct URL access works and renders the admin chrome, including Support/Logout.

Other notes: the commented image-upload nav target `"/admin-dashboard/image-upload"` does not match the real route `/admin-dashboard-image-upload`; the analytics page has a "No fake metrics" chip that contradicts its "Sample data only" labels; the system-settings preview and the live Support button both use the placeholder WhatsApp number `+234 800 000 0000`.

---

## 5. Data / auth layer (admin-relevant)

| Hook | Call | Auth header |
| --- | --- | --- |
| `useAdminExistsQuery` | `GET /admin/exists` | none (public) |
| `useAdminLoginMutation` | `POST /admin/login` | none |
| `useAdminRegisterMutation` | `POST /admin/register` | none |
| `useAdminDashboardStatsQuery` | `GET /admin/dashboard-stats` | `auth: "admin"` (backend `verifyAdmin`) |
| `useAdminOrdersQuery` | `GET /admin/getorders` | `auth: "admin"` (backend `verifyAdmin`) |
| `useAdminCartsQuery` | `GET /admin/carts` | `auth: "admin"` (backend `verifyAdmin`) |
| `useAdminUsersQuery` | `GET /admin/users` | `auth: "admin"` (Bearer; backend `verifyAdmin`) |
| `useSuperadminStatusQuery` | `GET /api/superadmin/status` | none (public) |
| `useSuperadminMeQuery` | `GET /api/superadmin/me` | `auth: "admin"` (any active admin) |
| `useSuperadminAdminsQuery` | `GET /api/superadmin/admins` | `auth: "admin"` (`verifySuperAdmin`; 403 for regular admins) |
| `useFoodsQuery` | `GET /food` | none (public read) |
| `useRushHourQuery` | `GET /settings/rush-hour` | none |
| Food create/update/delete | `POST/PUT/DELETE /food` | `auth: "admin"` |
| `useToggleRushHourMutation` | `PATCH /settings/rush-hour` | `auth: "admin"` |
| `useUpdateOrderStatusMutation` | `PUT /orders/:id/status` | `auth: "admin"` (backend route exists) |
| `useActivateSuperadminMutation` | `POST /api/superadmin/activate` | `auth: "admin"`; body `{ activationKey }` |
| `useCreateSuperadminAdminMutation` | `POST /api/superadmin/admins` | `auth: "admin"` (`verifySuperAdmin`) |
| `useSetSuperadminAdminStatusMutation` | `PATCH /api/superadmin/admins/:id/status` | `auth: "admin"` (`verifySuperAdmin`) |
| `useBlockSuperadminAdminMutation` | `PATCH /api/superadmin/admins/:id/block` | `auth: "admin"` (`verifySuperAdmin`) |
| `useUnblockSuperadminAdminMutation` | `PATCH /api/superadmin/admins/:id/unblock` | `auth: "admin"` (`verifySuperAdmin`) |
| `useRemoveSuperadminAdminMutation` | `DELETE /api/superadmin/admins/:id` | `auth: "admin"` (`verifySuperAdmin`) |

Cache keys: `["auth","admin","exists"]`, `["admin","dashboard-stats"]`, `["admin","orders"]`, `["admin","carts"]`, `["admin","users"]`, `["foods"]`, `["settings","rush-hour"]`, plus `queryKeys.superadmin` (`["superadmin"]`, `["superadmin","status"]`, `["superadmin","me"]`, `["superadmin","admins"]`, `["superadmin","activation"]`). Checkout/payment mutations invalidate `admin.carts` and `admin.dashboardStats` **but not `admin.orders`**, so the admin order list can stay stale. Socket events now invalidate `admin.orders` (and `admin.dashboardStats` on payment events), which partly mitigates the stale-order-list issue for live sessions.

`src/lib/store.js` is a legacy localStorage mock layer (`dunnkayce_state_v3`) with **plaintext demo credentials** (`admin@dunnkayce.com` / `admin123`), a client-side `login()` comparison, and local-only food/order mutations. Do not treat it as an authority for admin auth or data; remove demo credentials from production bundles. See `src/lib/api/README.md` for the full query/mutation reference.

---

## 6. Audit findings — prioritized

Status key: **P0** = security/data-integrity blocker, **P1** = functional bug, **P2** = quality/UX debt.

### P0 — security

| ID | Location | Finding | Fix |
| --- | --- | --- | --- |
| S1 | `adminlogin.jsx:111-112`, `admin.jsx:13-29`, `admin-dashboard.jsx:52-66`, `__root.jsx:56-69` | Admin JWT and identity in `sessionStorage`, readable by any XSS; all guards are client-side | Move to `HttpOnly; Secure; SameSite` cookies (or in-memory + refresh); enforce role server-side |
| S2 | `router.jsx:16-21`, `routeTree.gen.ts:80-148` | No route guard on any of the 12 admin URLs | Add a shared guarded admin layout (`beforeLoad` → `redirect('/adminlogin')`) and nest routes under it |
| S3 | `queries.js` admin reads | **Closed:** admin GETs pass `auth: "admin"` and every admin data route is gated by backend `verifyAdmin` (agent B5) | — |
| S4 | `adminlogin.jsx` | **Mitigated:** registration is public only while zero admins exist and is optionally gated by backend `ADMIN_BOOTSTRAP_KEY`; it creates a regular `admin` | Activate the designated admin with `SUPER_ADMIN_ACTIVATION_KEY` |
| S5 | `store.js:1,39-42,124,133,137,162` | Plaintext passwords and seeded admin credentials in shipped client code | Remove demo creds; never persist passwords locally |
| S6 | `AdminNavbar.jsx:87-91`, `session.js:44-50` | Logout leaves `localStorage.authToken` (rehydrated by root) and logs out the student side too | Consolidate one logout that clears all keys + cache; split admin-only from full logout |
| S7 | `AdminNavbar.jsx:236-252`, `food-management.jsx:457-468` | Dialogs lack focus trap/Escape; closed mobile drawer remains tab-focusable | Add focus management, `inert`/conditional mount, keyboard dismissal |
| S8 | `client.js:85-103` | Network/CORS failures throw raw `TypeError`, not `ApiError`; raw server payloads are retained | Wrap `fetch`, sanitize error messages |

**Auth boundary note:** all admin routes are now gated on the backend by `verifyAdmin` in `middleware/adminAuth.js` (including `/admin/dashboard-stats`, `/admin/users`, `/admin/carts`, `/admin/getorders`, food writes, `PATCH /settings/rush-hour` and `PUT /orders/:id/status`), and the client sends `auth: "admin"`. Admin-management routes additionally require `verifySuperAdmin`: regular admins get `403`, while blocked/inactive admins get `401` and are signed out. The old claim that only `/admin/users` was authenticated is obsolete.

### P1 — functional

| ID | Location | Finding | Fix |
| --- | --- | --- | --- |
| F1 | `admin-dashboard.jsx:44-46` | Queries run before the session guard; no 401 handling | Gate with `enabled: !!admin` + central 401 redirect |
| F2 | `admin-dashboard.jsx:103-106,126-144` | AOV divides weekly revenue by all-time orders; currency rounded to whole naira | Use a weekly order count and 2-decimal formatting |
| F3 | `admin-dashboard.jsx:60-65,68-78` | `JSON.parse("null")` leaves the page stuck in its loader | Validate parsed shape; redirect when falsy |
| F4 | `admin-dashboard.jsx:89-96,247-255` | Rush-hour toggle can use stale `intended` value; retry buttons spammable | Include `isFetching` in busy state; disable retry while refetching |
| F5 | `food-management.jsx:270,332,439` | Only `_id` used; backend may return `id` → broken keys/edit/delete | Normalize `_id ?? id` once at the boundary |
| F6 | `food-management.jsx:420-435,443` | FormData branch drops `imageUrl`; `data.food` dereferenced unsafely | Include `imageUrl` in FormData; access `data?.food` defensively |
| F7 | `order-management.jsx` | **Closed on backend:** `PUT /orders/:id/status` now exists and is guarded by `verifyAdmin` | — |
| F8 | `order-management.jsx:439,453-455`, `student-cart.jsx:41-43,165-170` | Query failures render the empty state | Add explicit error branches with retry |
| F9 | `student-cart.jsx:47-48,62-64` | Malformed carts crash/sum wrong; "last updated" uses `createdAt` | Normalize fields; use a real update timestamp |
| F10 | `mutations.js:111-148` | Checkout does not invalidate `admin.orders` | Add `queryKeys.admin.orders()` to invalidation |
| F11 | `adminlogin.jsx:51-60,111,77` | Network fallback forces login mode; empty string stored as token; password retained after registration | Explicit retry state; require token; reset form |
| F12 | `AdminNavbar.jsx:12,16-19` | Commented nav items reference unimported icons and one wrong path | Fix path/imports before enabling hidden routes |

### P2 — quality / UX / accessibility

- **Addressed:** hidden preview pages now carry `noindex, nofollow` meta and are absent from the sidebar (§0).
- **Addressed:** light/dark/system theme works via `ThemeProvider`, a `.dark` token block and a pre-paint script (§0). The old "dark mode non-functional" finding is obsolete.
- **Contrast:** `--primary` on near-white is ≈3:1, below WCAG AA 4.5:1 (`styles.css:69-70`); affects primary buttons and active nav tiles.
- **Addressed:** loading skeletons now use `role="status"` / `aria-live` (§0); older audit wording about `aria-hidden`-only skeletons is obsolete.
- **Realtime is now wired into the admin surface:** order management invalidates `["admin","orders"]` on `order_status_updated` / `order_ready` / `order_delivered`, and `AdminPaymentNotifier` handles `payment_confirmed` / `payment:received` (toast, optional browser notification, invalidate orders + dashboard stats). These use the authenticated `getAdminSocket()` singleton and remove listeners on unmount; logout calls `disconnectAdminSocket()`. The legacy default `socket` export still connects at module load (polling-first) using `VITE_SOCKET_URL` / `VITE_API_URL` with a fallback, and is never torn down; student cart/users pages remain manual-refresh only. Copy claiming socket.io is used *only* by `user-dashboard.jsx` is obsolete.
- **Hardcoded placeholders:** WhatsApp `2348000000000` (`AdminNavbar.jsx:96`, also `Navbar.jsx:54`), `admin@dunnkayce.com` (`adminlogin.jsx:274,338`), `placehold.co` fallbacks, prod backend/socket URLs. `window.open(..., "_blank")` lacks `noopener,noreferrer`.
- **Config drift:** `routeTree.gen.ts` declares SSR (`ssr: true`, `start.js`) but `vite.config.js` has no Start plugin and `main.tsx` is pure client — effective runtime is SPA. The TanStack Router Vite plugin **is** registered now, so route files regenerate `routeTree.gen.ts` on dev/build.
- **Misc dead code:** `mounted` state (`AdminNavbar.jsx:30`), dead `onSubmit` in the change-password preview, unused `DunnkayceLoader` import (`student-cart.jsx:3`), unused `Link`/`useRouter` in `__root.jsx`, stale "No backend" header in `store.js`, themed `Toaster` wrapper in `ui/sonner.jsx` unused (root mounts stock Sonner with `richColors`).
- **No security headers** in `vercel.json` (CSP, `X-Content-Type-Options`, `Referrer-Policy`); SPA catch-all can return HTML for missing assets.
- **No route-level `errorComponent`** anywhere in the admin area.

---

## 7. Backend gaps to expect in the UI

1. **Closed:** `PUT /orders/:id/status` now exists and is admin-guarded; the old "commented out / 404" note is obsolete. The UI displays the backend's `readyAt` / `deliveredAt` / `etaMinutes` as fulfillment evidence (with an `updatedAt` fallback for legacy delivered orders).
2. `PATCH /settings/rush-hour` **toggles** server-side and ignores the request body; trust the response's `rushHour`, not the sent value.
3. `/admin/dashboard-change-password` has no endpoint.
4. **Closed:** all admin data routes (`/admin/dashboard-stats`, `/admin/getorders`, `/admin/carts`, `/admin/users`, food writes, rush hour, order status) are gated by `verifyAdmin`; the Super Admin API is live under `/api/superadmin` with `/admin/admins` aliases. See `ADMIN_ACCOUNTS.md`.
5. Signup (user-facing) returns no token.

---

## 8. Adding a new admin page

1. Create `src/routes/admin-dashboard-<name>.jsx` with `createFileRoute` and wrap the content in `AdminShell`.
2. Add an entry to `adminNavItems` (`AdminNavbar.jsx:9-21`) **and import its icon at line 3**.
3. Add query keys in `src/lib/api/keys.js`, hooks in `queries.js`/`mutations.js`, and import from `@/lib/api` — never hardcode keys or `fetch` in the route.
4. Add a `beforeLoad` guard (or nest under a future guarded admin layout) and add an `errorComponent`.
5. `routeTree.gen.ts` regenerates automatically via the TanStack Router Vite plugin; do not hand-edit it.
6. Give loading states `role="status"` + `aria-live`, mark decorative icons `aria-hidden`, and add `noindex` while the page is a preview.
7. Re-run the audit checklist in §6 before enabling real data, especially S1–S3 and F1.

---

## 9. Related docs

- `ADMIN_ACCOUNTS.md` — Super Admin role model, endpoint table and testing checklist.
- `SUPER_ADMIN_SETUP.md` — production activation walkthrough and troubleshooting.
- `src/routes/README.md` — file-based routing conventions.
- `src/lib/api/README.md` — full query/mutation/key reference and backend caveats.
- `DESIGN_SYSTEM.md` — 2026 visual redesign contract (tokens, theme, shared kit and page rules).
- `package.json` — scripts and dependencies (React 19, TanStack Router/Query, Tailwind v4, Vite 7).
