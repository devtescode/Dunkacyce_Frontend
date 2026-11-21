# Super Admin setup

Operational guide for the implemented Super Admin flow. Canonical role is `superadmin` (the frontend also accepts the legacy `super_admin` alias). Exactly one Super Admin exists, enforced by a MongoDB unique partial index on `{ role: 1 }` with `partialFilterExpression: { role: "superadmin" }`.

Full API contract and test checklist: `ADMIN_ACCOUNTS.md`.

## 1. Backend environment

Set these in the **backend** deployment only (e.g. Render dashboard / backend `.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_JWT_SECRET` | Yes | Signs admin JWTs (existing). |
| `SUPER_ADMIN_ACTIVATION_KEY` | Yes, to activate | Long random secret checked by `POST /api/superadmin/activate`. Missing → `503`. |
| `ADMIN_BOOTSTRAP_KEY` | Optional | If set, the first `/admin/register` call must include a matching `bootstrapKey`. |

On startup the admin model creates the unique partial index and migrates legacy documents to `role: "admin"`, `status: "active"`, `isActive: true`, `tokenVersion: 0`.

## 2. Frontend environment

The frontend only needs the public API base URL in `frontend/.env.local`:

```env
VITE_API_URL=https://dunkacyce-backend.onrender.com
```

No `/api` suffix — hooks call literal paths such as `/api/superadmin/admins`. **Never put `SUPER_ADMIN_ACTIVATION_KEY` or `ADMIN_BOOTSTRAP_KEY` in the frontend** or any `VITE_*` variable; anything prefixed `VITE_` is baked into the browser bundle.

## 3. Create the first admin (regular `admin`)

While zero admins exist, `GET /admin/exists` returns `{ exists: false }` and the login page shows the registration form. Registration is public only in this window and always creates a **regular `admin`**, never a Super Admin.

```http
POST /admin/register
Content-Type: application/json

{ "username": "Owner", "email": "owner@example.com", "password": "<strong-password>" }
```

If `ADMIN_BOOTSTRAP_KEY` is configured, add `"bootstrapKey": "<value>"` to the body (`GET /admin/exists` reports `requiresBootstrapKey: true`). Once an admin exists, this route is closed.

> **Two different keys — do not mix them up.** `ADMIN_BOOTSTRAP_KEY` only gates this very first registration and creates a **regular `admin`**. It does **not** grant admin-management access. The key that unlocks creating other admins is `SUPER_ADMIN_ACTIVATION_KEY`, used in step 5.

## 4. Log in as that admin

```http
POST /admin/login
Content-Type: application/json

{ "email": "owner@example.com", "password": "<strong-password>" }
```

Response contains `token`, `admin` (with `role: "admin"`), top-level `role` and `isSuperAdmin: false`. The frontend persists this role with the session. Blocked/inactive accounts cannot log in.

## 5. Activate the Super Admin

In the UI, while no Super Admin exists, a **Finish Setup** link appears in the admin sidebar (Security group) and a banner on the Overview page, plus a top-bar button. It opens `/admin-dashboard-superadmin`; enter the activation key there. Once activated, that setup link disappears and the role-only **Super Admin** item takes its place.

Equivalent raw API call using the token from step 4 and the backend-only key:

```http
POST /api/superadmin/activate
Authorization: Bearer <adminToken>
Content-Type: application/json

{ "activationKey": "<SUPER_ADMIN_ACTIVATION_KEY>" }
```

PowerShell example:

```powershell
$body = @{ activationKey = $env:SUPER_ADMIN_ACTIVATION_KEY } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/superadmin/activate" `
  -Headers @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" } `
  -Body $body
```

Success: `200 { message, admin, tokenVersion }` with `admin.role: "superadmin"`.

Possible errors: `400` missing `activationKey`, `403` wrong key, `409` already activated (unique index / atomic guard), `503` server env missing, `401` session revoked/invalid token.

## 6. Refresh the session

Activation keeps the token from step 5 valid (no `tokenVersion` bump). The frontend mirrors the returned role into the stored identity, and the backend reads the authoritative role from the database on every request. Log out and back in only if you want the JWT's `role` claim refreshed.

Verify:

```http
GET /api/superadmin/me
Authorization: Bearer <adminToken>
```

Expect `role: "superadmin"` and `canManageAdmins: true`. `GET /api/superadmin/status` is public and should report `exists: true, hasSuperAdmin: true, activated: true`.

## 7. Manage regular admins

In the UI, the **Super Admin** sidebar item opens `/admin-dashboard-superadmin` (old `/admin-dashboard-admins` redirects there). You can create, activate, deactivate, block, unblock and delete regular admins; self and superadmin rows are protected. Every status change increments `tokenVersion`, so the affected admin is signed out immediately on their next request.

API equivalents (all require the Super Admin Bearer token):

| Action | Endpoint |
| --- | --- |
| List | `GET /api/superadmin/admins?search=&status=&page=1&limit=10` |
| Create (always `role: "admin"`) | `POST /api/superadmin/admins` |
| Set status | `PATCH /api/superadmin/admins/:id/status` |
| Block | `PATCH /api/superadmin/admins/:id/block` |
| Unblock | `PATCH /api/superadmin/admins/:id/unblock` |
| Delete | `DELETE /api/superadmin/admins/:id` |

The same operations are available under `/admin/admins` aliases with identical authorization.

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `503 Super Admin activation is not configured` | `SUPER_ADMIN_ACTIVATION_KEY` missing in backend env; set and redeploy. |
| `403 Invalid activation key` | Wrong key; read it from backend env, never from frontend config. |
| `409 A Super Admin has already been activated` | One already exists; log in as that account. Do not try to bypass the unique index. |
| `401 Session revoked, please sign in again` | `tokenVersion` changed after a status change, or the account was deleted; log in again with an active account. |
| `401 Admin account is blocked/inactive` | Admin was blocked/deactivated; ask the Super Admin to unblock/reactivate. |
| `403 Super Admin access required` | Regular admin attempted management route; use the Super Admin account. |
| Super Admin link missing in sidebar | The session role is not `superadmin`/`super_admin`; re-login after activation. |
