import { io } from "socket.io-client";

export const SOCKET_URL = String(
  import.meta.env?.VITE_SOCKET_URL ||
    import.meta.env?.VITE_API_URL ||
    "https://dunkacyce-backend.onrender.com",
).replace(/\/+$/, "");

export const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"], // 👈 IMPORTANT FIX
  withCredentials: false,
});

let adminSocket = null;

/**
 * Returns a singleton admin Socket.IO connection authenticated with the
 * current admin JWT. Returns null when no admin token is present.
 * The connection is reused across admin page navigations.
 */
export function getAdminSocket() {
  if (typeof window === "undefined") return null;

  const token = window.sessionStorage.getItem("adminToken");
  if (!token) return null;

  if (adminSocket) {
    // Keep auth fresh in case token was rotated.
    adminSocket.auth = { token };
    if (!adminSocket.connected) adminSocket.connect();
    return adminSocket;
  }

  adminSocket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    withCredentials: false,
    auth: { token },
  });

  return adminSocket;
}

export function disconnectAdminSocket() {
  if (!adminSocket) return;
  adminSocket.removeAllListeners();
  adminSocket.disconnect();
  adminSocket = null;
}

/** Order lifecycle events broadcast over Socket.IO. */
export const ORDER_STATUS_EVENTS = ["order_status_updated", "order_ready", "order_delivered"];

let userSocket = null;

/**
 * Returns a singleton user Socket.IO connection authenticated with the
 * current user JWT (session token first, then the remembered auth token).
 * Returns null on the server or when no token is present.
 */
export function getUserSocket() {
  if (typeof window === "undefined") return null;

  const token = window.sessionStorage.getItem("token") || window.localStorage.getItem("authToken");
  if (!token) return null;

  if (userSocket) {
    // Keep auth fresh in case the token was rotated.
    userSocket.auth = { token };
    if (!userSocket.connected) userSocket.connect();
    return userSocket;
  }

  userSocket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    withCredentials: false,
    auth: { token },
  });

  return userSocket;
}

export function disconnectUserSocket() {
  if (!userSocket) return;
  userSocket.removeAllListeners();
  userSocket.disconnect();
  userSocket = null;
}
