# Admin accounts — Super Admin / Admin model

## Status

**Implemented in both repos (verified 2026-11-21).** The backend exposes the complete Super Admin API under `/api/superadmin` (plus `/admin/admins` compatibility aliases), enforces `verifyAdmin` / `verifySuperAdmin` middleware, and persists exactly one Super Admin with a MongoDB unique partial index. The frontend has a dedicated Super Admin page; there is no "endpoints not deployed" notice and no mocked admin data. Setup walkthrough: `SUPER_ADMIN_SETUP.md`.

## Role model

| Role | Dashboard access | Manage food / orders / carts / users | Create, activate, block, unblock or remove admins |
| --- | --- | --- | --- |
| `superadmin` | Yes | Yes | **Yes** |
| `admin` | Yes | Yes | **No — backend returns 403** |

- The canonical backend role string is **`superadmin`**. The frontend also accepts the legacy alias `super_admin` (`SUPER_ADMIN_ROLES` in `src/lib/adminSession.js`), but the backend only ever writes `superadmin`.
- **Exactly one Super Admin** is enforced atomically by a MongoDB unique partial index on `{ role: 1 }` with `partialFilterExpression: { role: "superadmin" }`. A second activation fails with `E11000` and is reported as `409`.
- The Super Admin cannot be demoted, deactivated, blocked or deleted through the UI. The server also protects self and superadmin rows.
- Additional admins are created by the Super Admin and **always** receive `role: "admin"` — any client-supplied `role` is ignored.
- `status` is `active` | `inactive` | `blocked`, mirrored by `isActive`. `tokenVersion` is incremented on every status change (block/deactivate/unblock), so old tokens are revoked immediately. Activation deliberately does **not** bump it, so the designated admin keeps their session.

## Bootstrap and activation

1. **First admin registration** — `POST /admin/register` is public **only while zero admins exist** (`GET /admin/exists` → `{ exists: false }`, plus `requiresBootstrapKey` when configured). It always creates a regular `admin`, never a Super Admin. If the backend sets `ADMIN_BOOTSTRAP_KEY`, the body must include a matching `bootstrapKey`.
2. **Designated admin logs in** — `POST /admin/login` returns `{ token, admin, role, isSuperAdmin }` while the account is still a regular `admin`. Blocked/inactive accounts are rejected.
3. **Activate** — `POST /api/superadmin/activate` with `Authorization: Bearer <adminToken>` and body `{ "activationKey": "<SUPER_ADMIN_ACTIVATION_KEY from backend env>" }`. The key is compared in constant time and **never belongs in frontend code or `.env.local`**.
4. **Session stays valid** — activation does not increment `tokenVersion`, so the activating admin keeps using their existing token. The response includes the updated sanitized `admin` object; the frontend mirrors the returned role into the stored identity, and the middleware reads the authoritative role from the database on every request. A log out/in is only needed if you want the `role` claim inside the JWT refreshed.

## Backend endpoints

All paths are absolute on the Express app. Auth header: `Authorization: Bearer <adminToken>`.

| Method | Path | Authorization | Notes |
| --- | --- | --- | --- |
| POST | `/api/superadmin/activate` | `verifyAdmin` (any active admin) | body `{ activationKey }`; `200 { message, admin, tokenVersion }`; `400` missing key, `403` wrong key, `409` already activated, `503` env missing |
| GET | `/api/superadmin/status` | public | `{ exists, hasSuperAdmin, activated }` |
| GET | `/api/superadmin/me` | `verifyAdmin` | `{ id, email, username, role, status, canManageAdmins }` |
| GET | `/api/superadmin/admins` | `verifySuperAdmin` | query `search,status,page,limit` → `{ admins, stats: { total, active, inactive, blocked }, pagination: { page, limit, total, pages } }` |
| POST | `/api/superadmin/admins` | `verifySuperAdmin` | body `{ username, email, password }`; always role `admin`; `201 { message, admin }` |
| PATCH | `/api/superadmin/admins/:id/status` | `verifySuperAdmin` | body `{ status: "active" \| "inactive" }` or `{ isActive: boolean }` |
| PATCH | `/api/superadmin/admins/:id/block` | `verifySuperAdmin` | optional body `{ reason }` |
| PATCH | `/api/superadmin/admins/:id/unblock` | `verifySuperAdmin` | restores `active`; never grants Super Admin |
| DELETE | `/api/superadmin/admins/:id` | `verifySuperAdmin` | `200 { message }` |

The same handlers and authorization are mounted as aliases under `/admin/admins`: `GET ""`, `POST ""`, `PATCH /:id` (status), `PATCH /:id/block`, `PATCH /:id/unblock`, `DELETE /:id`.

Errors are always `{ message: string, code?: string }`; no password or hash is ever returned. Regular admins get **403** on every management endpoint. Blocked/inactive admins get **401** on any authenticated admin request, and the frontend signs them out.

## Frontend integration

| File | Change |
| --- | --- |
| `src/lib/adminSession.js` | Role normalization (`superadmin` + `super_admin` alias) and session persistence; login persists the backend role. The old behavior that marked the first setup account as `super_admin` in `localStorage` is removed. |
| `src/lib/api/keys.js` | `queryKeys.superadmin`: `all`, `status`, `me`, `admins`, `activation`. |
| `src/lib/api/queries.js` | `useSuperadminStatusQuery`, `useSuperadminMeQuery`, `useSuperadminAdminsQuery({ search, status, page, limit })`. |
| `src/lib/api/mutations.js` | `useActivateSuperadminMutation`, `useCreateSuperadminAdminMutation`, `useSetSuperadminAdminStatusMutation`, `useBlockSuperadminAdminMutation`, `useUnblockSuperadminAdminMutation`, `useRemoveSuperadminAdminMutation` (all invalidate `superadmin.admins()`, plus `status`/`me` where relevant). |
| `src/routes/admin-dashboard-superadmin.jsx` | New Super Admin-only management page with a `beforeLoad` redirect to `/admin-dashboard`. |
| `src/components/AdminNavbar.jsx` | One `superOnly` nav item labelled **Super Admin** (`Crown` icon) → new page. |
| `src/routes/admin-dashboard-admins.jsx` | Old path is now a redirect alias to `/admin-dashboard-superadmin`. |
| `src/routes/adminlogin.jsx` | Persists the role returned by `/admin/login`. |

The page shows statuses Active / Inactive / Blocked, stats Total / Active / Inactive / Blocked Admins, and actions Activate, Deactivate, Block, Unblock, Delete with confirmation dialogs. Self and superadmin rows cannot be blocked, deactivated or deleted.

## Environment

| Variable | Repo | Required | Purpose |
| --- | --- | --- | --- |
| `SUPER_ADMIN_ACTIVATION_KEY` | backend | Yes, for activation | Secret sent to `/api/superadmin/activate`; missing server env → `503`. |
| `ADMIN_BOOTSTRAP_KEY` | backend | Optional | If set, gates the first `/admin/register` call. |
| `ADMIN_JWT_SECRET` | backend | Yes | Signs/verifies admin JWTs (existing). |
| `VITE_API_URL` | frontend | Optional | Public API base URL (no `/api` suffix), defaults to `https://dunkacyce-backend.onrender.com`; use literal `/api/superadmin/...` paths in hooks. |

**Never put `SUPER_ADMIN_ACTIVATION_KEY` or `ADMIN_BOOTSTRAP_KEY` in frontend code or `frontend/.env.local`.** Only `VITE_*` variables are exposed in the browser bundle; `VITE_API_URL` is not a secret.

## Testing checklist

1. Fresh DB: `GET /admin/exists` → `{ exists: false }` (and `requiresBootstrapKey: true` when `ADMIN_BOOTSTRAP_KEY` is set); registration form is available.
2. First `/admin/register` creates a regular `admin` — verify `role: "admin"` in the DB and in the login response (never superadmin).
3. With `ADMIN_BOOTSTRAP_KEY` set, registration without/wrong `bootstrapKey` is rejected; with the key it succeeds.
4. Once an admin exists, `/admin/register` is no longer public / a second first-admin registration fails.
5. Login returns `token`, `admin.role: "admin"`, top-level `role` and `isSuperAdmin: false`.
6. Regular admin calling every `GET/POST/PATCH/DELETE /api/superadmin/...` management route from Postman gets **403** (`SUPER_ADMIN_REQUIRED`).
7. `/api/superadmin/activate` with missing key env → **503**; with empty `activationKey` → **400**; with a wrong key → **403**.
8. Successful activation → `200`, response `admin.role: "superadmin"`, `canManageAdmins` true via `/api/superadmin/me`.
9. A second activation attempt → **409** (unique partial index / atomic guard).
10. Activation deliberately does **not** bump `tokenVersion`, so the activating admin's current token stays valid; the frontend re-persists the returned `superadmin` role immediately (a logout/login also refreshes it).
11. Creating an admin with a body that includes `role: "superadmin"` still stores `role: "admin"`.
12. `GET /api/superadmin/admins` honours `search`, `status`, `page`, `limit` and returns `admins`, `stats` and `pagination`; no password/hash in any row.
13. Deactivate a regular admin → status `inactive`; their next authenticated request is **401** and the frontend signs them out.
14. Reactivate that admin → `active`; a fresh login works and the session is restored.
15. Block a regular admin (with reason) → status `blocked`; existing session and login are both rejected with **401**, and the UI signs them out.
16. Unblock → `active` again, `blockedReason` cleared, role still `admin` (never superadmin); fresh login works.
17. Self-protection: trying to block/deactivate/delete your own id → **400** ("You cannot change your own account").
18. Superadmin protection: trying to block/deactivate/delete the single superadmin row → **403**.
19. Delete a regular admin → `200`; that account can no longer log in.
20. `/admin/admins` aliases behave identically to the canonical routes, including the 403 for regular admins.
21. `GET /api/superadmin/status` is public and reports `activated: true` after step 8; `/api/superadmin/me` reports `canManageAdmins: false` for regular admins.
22. With a regular-admin session, the sidebar has no **Super Admin** item and direct `/admin-dashboard-superadmin` visits redirect to `/admin-dashboard`.
23. `/admin-dashboard-admins` redirects to `/admin-dashboard-superadmin` for a Super Admin.
24. Reactivating or unblocking increments `tokenVersion`, so a captured old token is rejected after each status change (immediate session revocation).

## Related docs

- `SUPER_ADMIN_SETUP.md` — step-by-step production setup and troubleshooting.
- `src/routes/ADMIN_README.md` — admin portal route/session audit.
- `src/lib/api/README.md` — query keys, hooks and endpoints.
