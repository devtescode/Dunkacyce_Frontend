export function getSessionUser() {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
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
  if (!user || !user.id) {
    sessionStorage.removeItem("user");
    return;
  }
  sessionStorage.setItem("user", JSON.stringify(user));
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
