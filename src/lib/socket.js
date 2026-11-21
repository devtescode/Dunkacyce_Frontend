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

/** Order lifecycle events broadcast over Socket.IO. */
export const ORDER_STATUS_EVENTS = ["order_status_updated", "order_ready", "order_delivered"];

function readAdminToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("adminToken");
}

function readUserToken() {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("token") || window.localStorage.getItem("authToken")
  );
}

let adminSocket = null;

/**
 * Returns a singleton admin Socket.IO connection authenticated with the
 * current admin JWT. Returns null when no admin token is present.
 * A changed token forces a fresh handshake so the server re-joins the right room.
 */
export function getAdminSocket() {
  if (typeof window === "undefined") return null;

  const token = readAdminToken();
  if (!token) {
    if (adminSocket) disconnectAdminSocket();
    return null;
  }

  if (adminSocket) {
    if (adminSocket.authToken !== token) {
      disconnectAdminSocket();
    } else {
      if (!adminSocket.connected) adminSocket.connect();
      return adminSocket;
    }
  }

  adminSocket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    withCredentials: false,
    // Re-evaluated on every reconnect so rotations are picked up automatically.
    auth: () => ({ token: readAdminToken() || token }),
  });
  adminSocket.authToken = token;

  return adminSocket;
}

export function disconnectAdminSocket() {
  if (!adminSocket) return;
  adminSocket.removeAllListeners();
  adminSocket.disconnect();
  adminSocket = null;
}

let userSocket = null;

/**
 * Returns a singleton user Socket.IO connection authenticated with the user's
 * JWT (session token first, then the remembered auth token). Returns null on
 * the server or when no token is present.
 */
export function getUserSocket() {
  if (typeof window === "undefined") return null;

  const token = readUserToken();
  if (!token) {
    if (userSocket) disconnectUserSocket();
    return null;
  }

  if (userSocket) {
    if (userSocket.authToken !== token) {
      disconnectUserSocket();
    } else {
      if (!userSocket.connected) userSocket.connect();
      return userSocket;
    }
  }

  userSocket = io(SOCKET_URL, {
    transports: ["polling", "websocket"],
    withCredentials: false,
    auth: () => ({ token: readUserToken() || token }),
  });
  userSocket.authToken = token;

  return userSocket;
}

export function disconnectUserSocket() {
  if (!userSocket) return;
  userSocket.removeAllListeners();
  userSocket.disconnect();
  userSocket = null;
}
