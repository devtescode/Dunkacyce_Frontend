/**
 * Shared HTTP client for the Dunnkayce backend (NewDun_BE).
 *
 * Every server-state hook in this folder goes through `apiFetch`, so auth
 * headers, error handling and the base URL have a single source of truth.
 */

const RAW_BASE =
  import.meta.env?.VITE_API_URL || "https://dunkacyce-backend.onrender.com";

export const API_BASE_URL = String(RAW_BASE).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Read the JWT relevant to the current session. */
export function getToken(type = "user") {
  if (typeof window === "undefined") return null;
  if (type === "admin") return window.sessionStorage.getItem("adminToken");
  return (
    window.sessionStorage.getItem("token") ||
    window.localStorage.getItem("authToken")
  );
}

function isPlainBody(body) {
  if (body == null) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams)
    return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  return true;
}

async function parsePayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * @param {string} path e.g. "/food" or "/cart/getusercart"
 * @param {object} options
 * @param {string} [options.method]
 * @param {unknown} [options.body] JSON-serialized unless FormData/string/Blob
 * @param {false|true|"user"|"admin"} [options.auth] which JWT to attach
 * @param {HeadersInit} [options.headers]
 * @param {AbortSignal} [options.signal]
 */
export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = false,
    headers: customHeaders,
    signal,
    ...rest
  } = options;

  const headers = new Headers(customHeaders || {});

  let payloadBody = body;
  if (isPlainBody(body)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    payloadBody = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken(auth === true ? "user" : auth);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${String(path).startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers,
    body: payloadBody,
    signal,
    ...rest,
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, { status: response.status, payload });
  }

  return payload;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: "GET" }),
  post: (path, options) => apiFetch(path, { ...options, method: "POST" }),
  put: (path, options) => apiFetch(path, { ...options, method: "PUT" }),
  patch: (path, options) => apiFetch(path, { ...options, method: "PATCH" }),
  delete: (path, options) => apiFetch(path, { ...options, method: "DELETE" }),
};
