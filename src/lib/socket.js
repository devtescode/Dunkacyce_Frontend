import { io } from "socket.io-client";

export const SOCKET_URL = "https://dunkacyce-backend.onrender.com";

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
