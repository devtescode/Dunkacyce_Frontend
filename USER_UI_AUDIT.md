# Dunnkayce User UI Audit

Audit date: 2026-11-21  
Workspace: `C:\Users\TESCODE\Desktop\Dun_FE\swift-campus-feast`

## Scope

This audit covers the **user-facing (student/customer) UI** of the Dunnkayce campus food ordering app. It focuses on:

- Public/auth screens: landing, signup, login
- Authenticated user screens: dashboard/menu, cart, checkout, orders, payments, profile, change password
- Shared user UI shell/components: root layout, navbar, footer, loader, theme/session infrastructure
- User-facing styling, responsiveness, accessibility, and UX/data-flow risks

**Out of scope for detailed audit:** admin dashboard/management screens, except where they affect shared infrastructure or navigation.

## Audit Method

The audit was produced by parallel codebase exploration and route/component-focused subagents, then consolidated against source files. Key files inspected include:

- App shell/routing: `src/routes/__root.jsx`, `src/router.jsx`, `src/routeTree.gen.ts`
- User routes: `src/routes/index.jsx`, `src/routes/login.jsx`, `src/routes/signup.jsx`, `src/routes/user-dashboard.jsx`, `src/routes/cart.jsx`, `src/routes/checkout.jsx`, `src/routes/orders.jsx`, `src/routes/payments.jsx`, `src/routes/profile.jsx`, `src/routes/change-password.jsx`
- Shared UI: `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/components/DunnkayceLoader.jsx`, `src/components/layout.jsx`
- Infrastructure: `src/lib/theme.jsx`, `src/lib/session.js`, `src/lib/store.js`, `src/lib/api/*`, `src/styles.css`, `src/main.tsx`, `index.html`

## Executive Summary

Dunnkayce is a React 19 + Vite + TanStack Router/Query SPA with Tailwind CSS v4, Radix/shadcn-style UI primitives, Zustand/local storage state, Axios/Fetch API helpers, Socket.IO realtime updates, and Sonner toasts. The user UI has a clear end-to-end flow: **discover menu -> sign up/login -> browse/add to cart -> enter delivery details -> pay via Paystack -> view orders/payments/profile**.

**Overall strengths**
- Clear visual identity: warm orange/gold/forest palette, display typography, rounded card-based layouts.
- Core user journey is present and mostly wired to backend APIs.
- TanStack Query is used for server state in most authenticated flows.
- `DunnkayceLoader` includes good loading semantics (`role="status"`, `aria-live`, reduced-motion classes).
- Theme infrastructure supports light/dark/system and FOUC prevention.

**Main risks/gaps**
- **Auth/route protection is fragmented**: user routes do client-side session checks in effects; no centralized route guard/beforeLoad.
- **State is split across systems**: sessionStorage, localStorage store, TanStack Query, and legacy mock store logic coexist.
- **Accessibility gaps** are common: missing labels/`aria` semantics for icon buttons, filter chips, selectable cards, modals, and mobile drawers.
- **Some flows are incomplete or fragile**: landing menu CTAs loop to `/`, rush-hour dashboard CTA does nothing, checkout can create order before payment init succeeds, receipts/payments UI assumes success.
- **Error handling is inconsistent**: some screens lack query error states and degrade to empty/blank UI.
- **Footer is implemented but not mounted**; `layout.jsx` is empty; several contacts/placeholders are hardcoded.

## Tech & UI Stack

| Area | Implementation | Evidence |
|---|---|---|
| Framework | React 19 + Vite 7 SPA | `package.json`, `vite.config.js`, `src/main.tsx` |
| Routing | TanStack Router file-based routes, generated route tree | `src/router.jsx`, `src/routes/*`, `src/routeTree.gen.ts` |
| Server state | TanStack Query | `src/lib/api/queries.js`, `src/lib/api/mutations.js` |
| Client state | Zustand-like local store + `useSyncExternalStore` | `src/lib/store.js` |
| Session | `sessionStorage` user/token helpers | `src/lib/session.js`, `__root.jsx` |
| Styling | Tailwind CSS v4, CSS variables, `tw-animate-css` | `src/styles.css`, `package.json` |
| UI primitives | Radix/shadcn-style components in `src/components/ui` | `src/components/ui/*` |
| Icons/toasts/charts | Lucide, Sonner, Recharts | routes/components, `package.json` |
| Realtime | Socket.IO client | `src/lib/socket.js`, `user-dashboard.jsx` |
| Payments | Paystack initialization + browser redirect | `checkout.jsx`, `src/lib/api/mutations.js` |

## User Route Inventory

| Route | File | Purpose | Auth | Primary Data |
|---|---|---|---|---|
| `/` | `src/routes/index.jsx` | Public landing/marketing page | Public | Static content |
| `/signup` | `src/routes/signup.jsx` | Account registration | Public | `useSignupMutation` |
| `/login` | `src/routes/login.jsx` | User login | Public | `useLoginMutation` |
| `/user-dashboard` | `src/routes/user-dashboard.jsx` | Browse menu, filter/search, add to cart | User session | Foods, rush hour, cart mutation, socket |
| `/cart` | `src/routes/cart.jsx` | Manage cart, delivery details, continue to checkout | User session | Current cart query/mutations |
| `/checkout` | `src/routes/checkout.jsx` | Confirm delivery, create order, initialize Paystack | User session + `dk_checkout` | Cart query, create order, init payment |
| `/orders` | `src/routes/orders.jsx` | Order history for successful/paid orders | User session | `useUserOrdersQuery` |
| `/payments` | `src/routes/payments.jsx` | Payment history and receipt modal | User session | `usePaymentHistoryQuery` |
| `/profile` | `src/routes/profile.jsx` | Edit profile details and photo | User session | `useUpdateProfileMutation`, session/store sync |
| `/change-password` | `src/routes/change-password.jsx` | Change user password | User session | `useChangePasswordMutation` |

## App Shell & Cross-Cutting UI

### Root Shell (`src/routes/__root.jsx`)
- Provides `ThemeProvider`, `QueryClientProvider`, global head/meta, styles, and themed `Toaster`.
- Restores session on mount from `sessionStorage.token`, `localStorage.authToken`, or `store.authToken`; parses `sessionStorage.user` and syncs into store.
- Shows full-page `DunnkayceLoader` until session bootstrap completes.
- Renders `Navbar` on non-admin paths only: `!pathname.startsWith("/admin")`.

**Audit notes**
- Good: centralized providers, session restore loader, theme-aware toaster.
- Gap: no centralized user auth guard; pages individually redirect.
- Gap: token restoration has multiple sources with unclear precedence; stale token resurrection is possible.
- Minor: unused `useRouter` import; stale commented Google Fonts link (fonts loaded via `@fontsource` in `src/main.tsx`).

### Theme (`src/lib/theme.jsx`, `src/styles.css`, `index.html`)
- Theme state supports `light`, `dark`, `system`; persists in `localStorage["dunnkayce-theme"]`.
- Applies `.dark` class and `color-scheme` on `<html>`; pre-hydration script in `index.html` reduces FOUC.
- Design tokens use OKLCH CSS variables mapped through Tailwind v4 `@theme inline`.

**Audit notes**
- Good: FOUC mitigation, system-theme listener, storage guards.
- Gap: default is `light`, not `system`.
- Gap: no user-facing theme toggle exposed in user UI (theme toggle appears admin-oriented).
- Gap: `prefers-reduced-motion` is globally aggressive (`0.01ms !important`), which can impair perceived state transitions.

### Session/Store (`src/lib/session.js`, `src/lib/store.js`)
- `session.js`: tab-scoped sessionStorage for `user`/`token`; normalizes `_id`; `clearSession()` also clears admin keys.
- `store.js`: localStorage-backed legacy/domain store with seed data, cart/order helpers, NGN formatting, hostel/delivery constants.

**Audit notes**
- Good: defensive browser/storage parsing.
- Risk: dual source of truth between sessionStorage, local store, and API query state.
- Risk: `store.js` contains mock/local auth and plaintext seeded credentials; UI should avoid local auth paths.
- Risk: logout must coordinate `store.logout()` + `clearSession()` + query cache clear; Navbar does this, but pattern is easy to regress.

## Screen-by-Screen Audit

### 1. Landing Page — `/` (`src/routes/index.jsx`)

**Purpose:** Public marketing/conversion page introducing Dunnkayce and driving signup/login.

**Key UI sections**
- Fixed landing nav with logo, anchor links, login/signup CTAs, mobile menu.
- Hero with campus badge, headline, CTA buttons, social proof, rotating “Today’s Special”.
- Marquee food strip, feature cards, sample menu preview, how-it-works steps, testimonials, final CTA banner.

**Data/behavior**
- Mostly static/local state: `mobileOpen`, `foodIndex`, timed hero rotation every 20s.
- Navigation to `/signup`, `/login`; menu CTA currently routes to `/`.

**Strengths**
- Strong first impression and clear conversion intent.
- Responsive layout with mobile/desktop nav variants.

**Issues/gaps**
- **Broken conversion flow:** `goMenu()` navigates to `/`; “ORDER NOW” and menu cards loop back to landing.
- **Marquee likely broken:** uses `animate-[marquee_...]` but no `marquee` keyframes found in `styles.css`.
- **Accessibility:** mobile drawer lacks focus trap/Escape/focus return; rotating hero has no pause/reduced-motion control; fixed nav anchor offset may hide section headings.
- **Content debt:** hardcoded claims/prices/testimonials, external hotlinked hero images, typo “Fulname”, unused/commented code.

### 2. Login — `/login` (`src/routes/login.jsx`)

**Purpose:** Authenticate existing users.

**Key UI**
- Centered auth card, logo/tagline, signup link, email/password fields, submit button, toasts.

**Data/behavior**
- `useLoginMutation()` posts to `/dunnkayce/login`.
- On success: normalizes user, syncs store, stores token in store/sessionStorage, sets session user, navigates to `/user-dashboard`.

**Issues/gaps**
- Minimal validation: required-only; no trim/field-level errors.
- Missing auth semantics: no `autocomplete`, explicit `htmlFor/id`, `aria-invalid`, or inline error region.
- Inconsistent token helper usage: sets `sessionStorage.token` directly instead of `setSessionToken`.
- No already-authenticated redirect guard.
- Non-API errors collapse to generic “Network error”.

### 3. Signup — `/signup` (`src/routes/signup.jsx`)

**Purpose:** Create a student account.

**Key UI**
- Full name, phone, gender select, email, password; login link; submit CTA.

**Data/behavior**
- `useSignupMutation()` posts to `/dunnkayce/signup`.
- On success: syncs session/store, conditionally stores token, navigates to `/`.

**Issues/gaps**
- Shallow validation: no password confirmation/strength, no phone format, no email normalization.
- Gender options limited to Male/Female (Other commented).
- Error handling style differs from login (`payload/status` duck typing vs `ApiError`).
- Post-signup redirect goes to `/`, while login goes to `/user-dashboard` — inconsistent UX.
- Same accessibility gaps as login (autocomplete, labels, inline errors).

### 4. User Dashboard / Menu — `/user-dashboard` (`src/routes/user-dashboard.jsx`)

**Purpose:** Authenticated menu browsing and add-to-cart.

**Key UI**
- Personalized hero, rush-hour status pill, CTA button.
- Category filters (`All`, `Foods`, `Protein`, `Swallow`) and search input.
- Responsive food grid with cards: image, badges, price, swallow stock/soup selector, quantity controls, add-to-cart.

**Data/behavior**
- Queries: foods, rush-hour status; mutation: add to cart.
- Realtime: socket listeners for `food_added`, `food_updated`, `food_deleted` update React Query cache.
- Auth guard: redirects to `/login` after hydration if no session user.

**Strengths**
- Core ordering interaction is rich and immediate.
- Realtime cache updates complement polling.

**Issues/gaps**
- **Rush-hour CTA dead end:** when rush hour is true, button logs to console and does nothing.
- **No empty/error states:** no “no results” UI; foods query errors not surfaced.
- **Accessibility:** search input lacks label; filter chips/soup chips lack radio/pressed semantics; food image missing alt; quantity controls lack accessible names.
- **Resilience:** no socket reconnect/resync handling; image fallback missing; duplicate polling + socket updates may be noisy.

### 5. Cart — `/cart` (`src/routes/cart.jsx`)

**Purpose:** Review cart, adjust quantities, capture delivery details, hand off to checkout.

**Key UI**
- Cart item cards with image, name, soup, unit price, remove, quantity stepper.
- Delivery form: hostel select, room input.
- Summary: subtotal, delivery fee, total, “Order” button.
- Empty state with browse-menu CTA.

**Data/behavior**
- `useCurrentUserCartQuery`, `useUpdateCartQtyMutation`, `useRemoveFromCartMutation`.
- Saves `dk_checkout` to `sessionStorage` and navigates to `/checkout`.

**Issues/gaps**
- No cart query error state/retry.
- No mutation pending guards; rapid clicks can race.
- Quantity has floor but no upper bound/stock-aware cap in UI.
- Accessibility: room input and select lack labels; remove/qty icon buttons lack accessible names.
- Delivery fee/totals are duplicated between cart and checkout; backend must remain authoritative.

### 6. Checkout — `/checkout` (`src/routes/checkout.jsx`)

**Purpose:** Final payment step via Paystack.

**Key UI**
- Back to cart, delivery destination, Paystack option card, order summary, pay button.
- Loading/empty states.

**Data/behavior**
- Reads `dk_checkout`; requires session user and cart.
- Creates order (`/orders/create`), initializes payment (`/cart/initialize-payment`), redirects to `authorization_url`.

**Strengths**
- Clear final summary and guarded entry from cart.

**Issues/gaps**
- **Order/payment sequencing risk:** order is created before payment initialization; failure after order creation may leave orphan/pending orders.
- No validation for `authorization_url`, `reference`, or user email before redirect/use.
- Payment method UI has state but only Paystack exists; method is effectively hardcoded.
- Selectable payment card lacks radio-group semantics/`aria-checked`.
- No explicit post-payment callback/verification route visible in frontend; depends on backend/Paystack flow.

### 7. Orders — `/orders` (`src/routes/orders.jsx`)

**Purpose:** Show user’s successful payment/order history.

**Key UI**
- Loading loader, empty state, order cards with ID, delivery, items, total, payment method, paid date.

**Data/behavior**
- `useUserOrdersQuery(user?.id)` fetches `/orders/user/:userId/receipts` (via query implementation). 
- Redirects unauthenticated users to `/login`.

**Issues/gaps**
- **No error state:** query errors are likely masked as empty state.
- Assumes all returned orders are successful; hardcodes “Payment Successful”.
- Missing semantic list/article/time structure; date formatting has no invalid-date fallback.
- No pagination/filter/detail/reorder/receipt actions.

### 8. Payments — `/payments` (`src/routes/payments.jsx`)

**Purpose:** Payment history with receipt modal.

**Key UI**
- Payment cards list; clicking opens receipt modal with transaction details and itemized totals.

**Data/behavior**
- `usePaymentHistoryQuery(user?.id)` fetches receipts.
- Modal controlled by local `selectedOrder` state.

**Issues/gaps**
- **No error state** for query failures.
- **Modal accessibility gaps:** no `role="dialog"`, `aria-modal`, focus trap, Escape handling, backdrop close, or focus return.
- **Cards not keyboard-operable:** clickable `div`s without button semantics.
- Receipt modal always shows “PAYMENT SUCCESSFUL” styling/banner; risky if non-paid statuses ever appear.
- `fetchPaymentHistory` does not pass `auth: "user"` in query implementation; confirm backend expectation.

### 9. Profile — `/profile` (`src/routes/profile.jsx`)

**Purpose:** View/edit profile and upload profile photo.

**Key UI**
- Avatar preview/fallback, camera upload button, file picker, name/email/phone/gender fields, save button.

**Data/behavior**
- Session-based initial load; updates via `useUpdateProfileMutation` (`PUT /dunnkayce/profile`, `auth: "user"`).
- On success: merges response, updates sessionStorage, syncs store, clears selected photo/preview.

**Strengths**
- Handles image preview lifecycle with object URL cleanup.
- Camera button has `aria-label`.

**Issues/gaps**
- No fresh profile fetch on mount; relies on sessionStorage and may be stale.
- Minimal validation: only image MIME prefix check and HTML required fields; no size/type/phone constraints.
- Gender limited to Male/Female; normalization may coerce unknown values to Male.
- No inline field errors, unsaved-change warning, cancel/reset, or autocomplete attributes.
- Save merges response over potentially stale session data; needs careful backend contract.

### 10. Change Password — `/change-password` (`src/routes/change-password.jsx`)

**Purpose:** Authenticated user password update.

**Key UI**
- Current/new/confirm password fields, submit button, toast feedback.

**Data/behavior**
- `useChangePasswordMutation()` sends `PUT /dunnkayce/change-password` with `auth: "user"`.
- Client validation: current required, new >= 6 chars, confirm matches.

**Issues/gaps**
- No `autocomplete="current-password"/"new-password"` attributes.
- No inline field errors/aria wiring; toast-only feedback.
- Inputs remain editable during submit; only button disabled.
- No new != old check, no password strength policy beyond length, no post-success reauth/session strategy.
- Client-storage-based auth guard only.

## Shared User UI Components

### Navbar (`src/components/Navbar.jsx`)
- **Role:** Authenticated user top nav + mobile drawer; hidden on auth pages and when no user.
- **Good:** active route styling, cart count badge, profile avatar fallback, logout clears store/session/query cache.
- **Gaps:** mobile drawer lacks dialog semantics/focus trap/Escape/focus return; no `aria-current`; hardcoded WhatsApp number; cart query runs before user guard returns; admin styling differs desktop/mobile.

### Footer (`src/components/Footer.jsx`)
- **Role:** Branded footer with quick links, social/support contacts.
- **Gaps:** appears unused/not mounted in app shell; placeholder/hardcoded contacts; “Menu” links to `/` instead of user dashboard; external links should use `noopener noreferrer`.

### DunnkayceLoader (`src/components/DunnkayceLoader.jsx`)
- **Role:** Branded loading indicator (`compact` and `page` variants).
- **Good:** accessible status semantics, sr-only label, decorative elements hidden, `motion-reduce` handling.
- **Gaps:** default label is “Loading your orders...” which can be misleading outside orders context; depends on custom theme tokens/animations.

### Layout Placeholder (`src/components/layout.jsx`)
- **Status:** empty file. No exports/usages observed. Should be implemented or removed to avoid dead-code confusion.

## Accessibility Audit Summary

| Area | Status | Notes |
|---|---|---|
| Semantic landmarks | Partial | `main`, `header`, `footer`, headings used in places; cards/lists/modals often div-based. |
| Form labels | Partial | Login/signup/profile use labels, but many inputs lack explicit `id/htmlFor`, autocomplete, error associations. |
| Keyboard operability | Partial | Native buttons/links mostly ok; payments cards are clickable divs; modal/drawer keyboard behavior incomplete. |
| Focus management | Weak | No focus trap/return/Escape for mobile nav drawer or receipt modal. |
| Status/feedback | Mixed | Loader/toasts good; many errors only toasts; some query failures have no visible error state. |
| Color/contrast reliance | Risk | Badges/status colors used heavily; text often present, but contrast should be verified against OKLCH tokens. |
| Motion | Mixed | Loader has motion-reduce; landing marquee/hero rotation and global reduced-motion override need care. |
| Images | Partial | Some alt text present; dashboard food images missing alt; external landing images have no fallback strategy. |

## Responsiveness Audit Summary

- **Generally responsive:** most pages use `max-w-*`, responsive padding, grid breakpoints, and mobile-first stacking.
- **Good patterns:** dashboard grid `1/2/3` cols; cart/checkout two-column layout at large screens; Navbar mobile drawer.
- **Watchpoints:** fixed landing nav anchor offset; sticky cart aside on desktop; modal sizing on small screens; long order/payment lists without pagination; hero/marketing text density on very small devices.

## Data, State, and Integration Observations

- **API base URL:** defaults to `https://dunkacyce-backend.onrender.com` when `VITE_API_URL` is unset (`src/lib/api/client.js`).
- **Auth token source:** `api/client.js` reads `sessionStorage.token` or `localStorage.authToken`.
- **Query keys:** centralized in `src/lib/api/keys.js`; mutations invalidate related cart/order/admin keys.
- **Realtime:** food updates use socket cache patching; rush hour uses polling.
- **Checkout handoff:** cart writes `dk_checkout` in sessionStorage; checkout recalculates totals from live cart.
- **Potential contract gaps:** some queries do not pass `auth: "user"` (e.g., receipts/orders depending on implementation); receipt modal assumes paid/successful data.

## Prioritized Findings

### High
1. **Checkout order/payment integrity risk** — order created before payment initialization; add idempotency/recovery/clear pending-order strategy (`src/routes/checkout.jsx`).
2. **Fragmented auth guarding** — add route-level/beforeLoad guards for authenticated user routes; avoid per-page flicker/duplication (`src/routes/__root.jsx`, user routes).
3. **Missing error states** — orders, payments, cart, dashboard should render explicit error/retry UI instead of silent empty states.
4. **Keyboard/a11y blockers** — make payment cards keyboard-operable/semantic; add dialog semantics/focus management for receipt modal and mobile drawer.

### Medium
5. **Landing conversion defects** — fix `goMenu()` target, restore menu links, add `marquee` keyframes or replace animation.
6. **Dashboard dead CTA** — implement rush-hour “Order Online Now” behavior or disable with explanation.
7. **State duplication** — reduce overlap between `store.js` legacy mock logic and API/session-driven state.
8. **Form UX/accessibility** — add autocomplete, `id/htmlFor`, inline validation, aria error wiring, and consistent auth flows.

### Low
9. **Dead/placeholder UI** — mount or remove `Footer`; remove or implement `layout.jsx`; centralize contact placeholders.
10. **Code hygiene** — remove unused imports/commented blocks, stale font link, console logs, and minor copy typos.

## Recommended Next Actions

1. **Define UI contracts:** document required API response shapes for cart/orders/payments/profile and add defensive schema parsing.
2. **Centralize auth:** create a shared authenticated route wrapper/`beforeLoad` guard and a single session/token source of truth.
3. **Accessibility pass:** fix labels, focus traps, Escape handling, keyboard-operable cards, `aria-current`, and dialog semantics.
4. **Reliability pass:** add query error boundaries/states, mutation pending states, socket reconnect refetch, and image fallbacks.
5. **Product polish:** repair landing CTAs, add empty/no-results states, align post-login/post-signup redirects, and expose a user theme toggle if intended.

## Appendix: Key Files

```text
src/routes/__root.jsx
src/routes/index.jsx
src/routes/login.jsx
src/routes/signup.jsx
src/routes/user-dashboard.jsx
src/routes/cart.jsx
src/routes/checkout.jsx
src/routes/orders.jsx
src/routes/payments.jsx
src/routes/profile.jsx
src/routes/change-password.jsx
src/components/Navbar.jsx
src/components/Footer.jsx
src/components/DunnkayceLoader.jsx
src/components/layout.jsx
src/lib/theme.jsx
src/lib/session.js
src/lib/store.js
src/lib/api/client.js
src/lib/api/queries.js
src/lib/api/mutations.js
src/lib/api/keys.js
src/styles.css
```