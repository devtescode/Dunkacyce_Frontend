# Swift Campus Feast — Admin Design System Contract (2026 redesign)

This document is the **single source of truth** for the visual redesign. Every agent and every page must follow it. It is a design contract only — it does not change API behavior, route paths, auth, or query/mutation hooks.

## 1. Brand direction

Premium food-service dashboard for **DUNNKAYCE – Swift Campus Feast**.

- Palette: **deep forest green**, **fresh leaf green**, **clean white / off-white**, **golden yellow** accents.
- Mood: fresh, premium, calm, fast. Generous whitespace, rounded surfaces, soft layered shadows, subtle gradients.
- Typography: keep bundled `Inter` (`font-sans`) and `Bebas Neue` (`font-display`). Display type for headings and large KPI numbers; Inter for UI and data.
- Never use orange as the primary brand colour (legacy palette). Gold is reserved for accents/warnings/premium highlights.
- Dark theme must be a deep forest green surface with fresh-green primary and gold accents — not a grey inversion.

## 2. Token rules (`src/styles.css`)

Keep **every existing token name** from `@theme inline` and `:root` — pages and shadcn primitives depend on them. Recolour values and add new aliases:

- `--color-forest`, `--color-forest-deep`, `--color-fresh`, `--color-gold`, `--color-gold-soft`, `--color-surface`.
- Light: `--background` off-white green tint, `--card` white, `--foreground` deep forest, `--primary` AA-safe forest green (contrast ≥ 4.5:1 on white), `--secondary`/`--muted` pale green, `--accent`/`--warning` golden yellow, `--success` fresh green, `--ring` forest green.
- Add a full `.dark { ... }` token block (same names) using deep forest backgrounds, near-white foreground/card text, fresh-green primary, gold accent, dark borders/inputs.
- Keep `@custom-variant dark (&:is(.dark *))`, keyframes `dk-spin`, `dk-float`, `dk-shimmer`, `dk-pulse-soft`, `@source "../src"`.
- Add small `@layer components` helpers if useful: `.admin-panel`, `.admin-eyebrow`, `.admin-focus`, `.preview-stripe`. Do not remove existing utilities.

## 3. Theme controller

`src/lib/theme.jsx` exports `ThemeProvider` and `useTheme()` → `{ theme, setTheme, toggleTheme, resolvedTheme }`.

- `theme` ∈ `"light" | "dark" | "system"`; persisted in `localStorage["dunnkayce-theme"]`.
- `resolvedTheme` ∈ `"light" | "dark"` from system media query when `theme === "system"`.
- Applies/removes the `dark` class on `document.documentElement`; listens for system changes; no SSR crashes.
- Mount `ThemeProvider` in `src/routes/__root.jsx` around the existing `QueryClientProvider`. Keep the session bootstrap effect and `<Outlet />` untouched. Use the themed `Toaster` wrapper (`src/components/ui/sonner.jsx`) with the resolved theme, preserving `position="top-center"`.
- Add a pre-paint inline script in `index.html` that reads `dunnkayce-theme` / `prefers-color-scheme` and sets `.dark` before CSS paints. Replace broken `/vite.svg` favicon with an inline forest-green SVG data URI.

## 4. Shared admin kit — exact API

All presentational components live in `src/components/admin/` and are re-exported from `src/components/admin/index.js`. They accept plain props, use `cn()` + semantic Tailwind tokens, and contain **no data fetching, no hooks that call APIs, no router navigation** (except `ThemeToggle` using `useTheme`). Pages must import from `@/components/admin`.

| Export | Props (all optional unless marked required) | Purpose |
| --- | --- | --- |
| `AdminPanel` | `as = "section"`, `className`, `children`, ...rest | Rounded bordered card surface |
| `SectionHeading` | `eyebrow`, `title` (required), `description`, `action`, `className` | Consistent section header |
| `StatCard` | `label` (required), `value`, `hint`, `icon`, `tone = "forest"`, `isLoading = false`, `className` | KPI tile; renders skeleton when loading; `value` may be ReactNode |
| `StatusPill` | `children` (required), `tone = "neutral"`, `dot = true`, `className` | Status badge; tones: forest, fresh, gold, blue, violet, rose, neutral |
| `SearchField` | `id`, `label = "Search"`, `placeholder`, `value` (required), `onChange` (required), `className`, ...inputProps | Search input with icon and sr-only label |
| `FilterSelect` | `id`, `label` (required), `value` (required), `onChange` (required), `options = [{value,label}]` (required), `className` | Labelled select with chevron |
| `RefreshButton` | `onClick` (required), `isFetching = false`, `label = "Refresh"`, `className` | Manual refresh control with spin state |
| `EmptyState` | `icon`, `title` (required), `description`, `action`, `className` | Consistent empty state |
| `ErrorState` | `title = "Something went wrong"`, `description`, `onRetry`, `retryLabel = "Try again"`, `className` | Explicit error state with retry |
| `LoadingBlock` | `label = "Loading…"`, `caption`, `rows = 3`, `variant = "cards" \| "rows" \| "table"`, `className` | Accessible skeleton with `role="status"` + `aria-live="polite"` |
| `FoodImage` | `src`, `alt` (required), `className`, `ratio = "aspect-[4/3]"`, `seed`, `loading = "lazy"`, `referrerPolicy = "no-referrer"` | Image with fixed ratio, local SVG fallback, no layout shift |
| `ThemeToggle` | `compact = false`, `className` | Light/dark/system toggle button using `useTheme()` |
| `PreviewBadge` | `label = "Preview · Not connected"`, `className` | Unmistakable preview marker |
| `PreviewBanner` | `title` (required), `description`, `statusRows = [{label,value}]`, `children`, `className` | Hero panel for preview pages |
| `PageHeader` | `eyebrow`, `title`, `description`, `actions`, `className` | Optional standalone page header (AdminShell uses its own) |

Tone class maps must be centralized inside the kit (e.g. `toneClasses`) so every page renders identical colours in light and dark.

## 5. Food imagery

`src/lib/foodImages.js` exports:

- `FOOD_PHOTOS` — curated, stable `images.unsplash.com/photo-...` URLs (auto=format, fit=crop, w=800/1200, q=80) grouped by category: rice/swallow/protein/soup/snack/drink.
- `FOOD_HIGHLIGHTS` — 4–6 named photo entries used for dashboard highlights and catalogue inspiration, each `{ name, category, src }`.
- `getFoodPhoto(foodOrName)` — deterministic photo selection (hash of name) used as fallback when an API image is missing/broken.
- `FOOD_FALLBACK_SVG` — inline data-URI SVG plate illustration used by `FoodImage` on error.

Rules: consistent `aspect-[4/3]` for cards/previews (1:1 thumbnails only where space is tight), `object-cover`, rounded corners, `loading="lazy"`, `decoding="async"`, `referrerPolicy="no-referrer"`, one-shot `onError` fallback. Never display a broken image or a remote placeholder service.

## 6. Chrome

- `AdminShell` keeps the exact props `{ eyebrow, title, description, actions, children, className }`, still mounts `<AdminPaymentNotifier />` and wraps in `<AdminNavbar>`. Restyle its header with a forest-gradient banner, eyebrow, display title, and action slot. `min-w-0` must stay on content wrappers.
- `AdminNavbar` keeps `adminNavItems` (including the uncommitted Users item), exact `to` paths, active state via `pathname === item.to`, `localStorage.adminDesktopSidebarOpen` collapse persistence, `disconnectAdminSocket()` + `store.logout()` + `clearSession()` + `queryClient.clear()` logout order, and the mobile drawer. Improve: dark forest sidebar in light mode, gold active indicator, theme toggle in the sidebar/top bar, Escape-to-close and `inert`/conditional mount for the closed drawer, `noopener,noreferrer` on support link, visible section label for hidden preview routes ("Preview workspace — no active navigation item").
- `DunnkayceLoader` gets a green/gold reskin but keeps `role="status"`, `aria-live="polite"`, `aria-busy="true"`, `motion-reduce:animate-none`, and the `variant`, `label`, `caption`, `icon`, `className` props.

## 7. Page rules (non-negotiable)

1. Preserve every route path and `createFileRoute` call. Never hand-edit `routeTree.gen.ts`.
2. Preserve every API/query/mutation hook and cache key. Never add `fetch`, new endpoints, or mock data to functional pages.
3. Preserve all handlers, toasts, filters, sorts, form payloads, session writes, and validation gates. Visual pass only, except:
   - Order status control is lock-gated: a lock button unlocks the per-order status `<select>`, and a confirmed change calls `useUpdateOrderStatusMutation` (`PUT /orders/:id/status`). Show the recorded ready/delivered date and time as evidence; never claim the endpoint is unavailable.
   - Explicit error branches may be added where errors previously rendered as empty states (orders, carts). Must reuse existing `refetch()`.
   - Inline field errors and form-state cleanup may be added on login/food forms without weakening validation.
   - `id ?? _id` normalization, `data?.food` safety, and local SVG image fallbacks are allowed.
4. Dashboard "popular food items", "recent orders", "revenue chart" must be **derived from real data** via existing hooks (`useAdminOrdersQuery`, `useFoodsQuery`), never fabricated. Show honest empty states when there is no data. Keep the original `useAdminDashboardStatsQuery`, `useRushHourQuery`, `useToggleRushHourMutation` behavior intact.
5. Hidden preview pages keep all mock constants, disabled controls, and explicit "Preview / sample data only" labels. Add `noindex, nofollow` meta to their `head()` and fix the contradictory "No fake metrics" chip. They stay hidden from the sidebar.
6. Loading skeletons need `role="status"`/`aria-live`; decorative icons `aria-hidden`; visible focus rings; AA contrast; keyboard navigation; `motion-reduce` support. Responsive from 360px mobile → tablet → 1600px desktop.
7. Use the kit consistently. Avoid one-off card/button styles; prefer `AdminPanel`, `StatCard`, `StatusPill`, `SearchField`, `FilterSelect`, `RefreshButton`, `EmptyState`, `ErrorState`, `LoadingBlock`.
8. Preserve uncommitted user work: `src/routes/admin-dashboard-users.jsx` (untracked), admin users query/key, socket env changes, `client.js` error sanitization, route tree entries, README updates, `disconnectAdminSocket()` logout call.

## 8. Verification

After implementation: `npm.cmd run build` must succeed; no route paths changed; no new endpoints; no duplicate API calls; both themes render; responsive checks at mobile/tablet/desktop.
