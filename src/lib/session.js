function normalizeSessionUser(user) {
  if (!user || typeof user !== "object") return null;
  const id = user.id ?? user._id;
  if (!id) return null;
  return { ...user, id };
}

export function getSessionUser() {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return normalizeSessionUser(parsed);
  } catch {
    return null;
  }
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("token");
}

export function setSessionUser(user) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSessionUser(user);
  if (!normalized) {
    sessionStorage.removeItem("user");
    return;
  }
  sessionStorage.setItem("user", JSON.stringify(normalized));
}

export function setSessionToken(token) {
  if (typeof window === "undefined") return;
  if (!token) {
    sessionStorage.removeItem("token");
    return;
  }
  sessionStorage.setItem("token", token);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
}
