/**
 * Admin identity / role helpers.
 *
 * IMPORTANT: these helpers are a UX convenience only. The backend must remain
 * the authority for admin roles and must enforce Super Admin permissions on
 * every admin-management endpoint. Never treat a client-side role check as a
 * security boundary.
 */

const SUPER_ADMIN_ROLES = new Set([
  "superadmin",
  "super_admin",
  "super-admin",
  "super admin",
  "owner",
]);

const ROLE_MAP_KEY = "dunnkayceAdminRoles";

function storage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function localStore() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readRoleMap() {
  const store = localStore();
  if (!store) return {};
  try {
    const parsed = JSON.parse(store.getItem(ROLE_MAP_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function identityKey(admin) {
  if (!admin || typeof admin !== "object") return "";
  return String(admin.id ?? admin._id ?? admin.email ?? admin.username ?? "").toLowerCase();
}

export function getAdminIdentity() {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem("admin");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function getAdminRole(admin = getAdminIdentity()) {
  if (!admin || typeof admin !== "object") return null;

  const direct =
    admin.role ?? admin.adminRole ?? admin.userRole ?? admin.type ?? admin.accountType;
  if (typeof direct === "string" && direct.trim()) return direct.trim().toLowerCase();

  if (admin.isSuperAdmin === true || admin.superAdmin === true || admin.isSuper === true) {
    return "super_admin";
  }

  // LEGACY / UX-ONLY fallback for old sessions. The first registered admin is
  // a REGULAR admin; only the backend can grant Super Admin via activation.
  // Kept for backwards compatibility — never treat this as authorization.
  const remembered = readRoleMap()[identityKey(admin)];
  return typeof remembered === "string" && remembered.trim()
    ? remembered.trim().toLowerCase()
    : null;
}

export function isSuperAdmin(admin = getAdminIdentity()) {
  const role = getAdminRole(admin);
  return typeof role === "string" && SUPER_ADMIN_ROLES.has(role.toLowerCase());
}

export function isAdminLoggedIn() {
  const store = storage();
  if (!store) return false;
  return Boolean(store.getItem("adminToken")) && Boolean(getAdminIdentity());
}

/**
 * LEGACY / UX-ONLY role map writer, kept for backwards compatibility with old
 * sessions. The backend is authoritative and first-admin setup creates a
 * REGULAR admin — Super Admin is granted only via server-side activation.
 */
export function rememberAdminRole(admin, role) {
  const local = localStore();
  const key = identityKey(admin);
  if (!local || !key || !role) return;
  const map = readRoleMap();
  map[key] = String(role).trim().toLowerCase();
  try {
    local.setItem(ROLE_MAP_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

/** Persist the admin session, keeping any role the backend supplied. */
export function persistAdminSession(token, admin, { rememberRole = true } = {}) {
  const store = storage();
  if (!store || !token || !admin || typeof admin !== "object") return null;

  const role = getAdminRole(admin);
  store.setItem("adminToken", token);
  store.setItem("admin", JSON.stringify(admin));

  if (rememberRole && role) {
    const local = localStore();
    const key = identityKey(admin);
    if (local && key) {
      const map = readRoleMap();
      map[key] = role;
      try {
        local.setItem(ROLE_MAP_KEY, JSON.stringify(map));
      } catch {
        /* storage unavailable — role stays in the session identity only */
      }
    }
  }

  return admin;
}

/** Clear the current admin session (session-scoped identity and token). */
export function clearAdminSession() {
  const store = storage();
  if (!store) return;
  store.removeItem("adminToken");
  store.removeItem("admin");
}

export const ADMIN_ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
};

export function formatAdminRole(role) {
  if (!role) return "Admin";
  return ADMIN_ROLE_LABELS[role.toLowerCase()] ?? role.replace(/_/g, " ");
}
