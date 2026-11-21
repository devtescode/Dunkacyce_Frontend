import { useEffect, useState } from "react";

export const FULFILLMENT_STATUSES = ["Pending", "Preparing", "Ready", "Delivered"];

export const DEFAULT_ETA_MINUTES = 8;

const MAX_VALID_TIME = 8.64e15; // Date's largest representable epoch (ms)

function toEpochMs(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && Math.abs(value) <= MAX_VALID_TIME ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^-?\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) && Math.abs(numeric) <= MAX_VALID_TIME ? numeric : null;
    }
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) || Math.abs(time) > MAX_VALID_TIME ? null : time;
}

/** Canonicalizes known statuses; unknown values are preserved for the UI to classify. */
export function normalizeStatus(order) {
  const raw = String(order?.status ?? "").trim();
  if (!raw) return "Preparing";
  return FULFILLMENT_STATUSES.find((status) => status.toLowerCase() === raw.toLowerCase()) || raw;
}

/** An effective ETA, allowing zero but rejecting invalid/negative values. */
function getEtaMinutes(order) {
  const raw = order?.etaMinutes;
  if (raw == null || raw === "") return DEFAULT_ETA_MINUTES;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_ETA_MINUTES;
}

export function getReadyAt(order) {
  return toEpochMs(order?.readyAt);
}

export function getDeliveredAt(order) {
  // Only a Delivered order has delivery evidence. A reversal clears deliveredAt
  // server-side, but guard here too so stale UI never claims a handoff.
  if (normalizeStatus(order) !== "Delivered") return null;
  const deliveredAt = toEpochMs(order?.deliveredAt);
  if (deliveredAt != null) return deliveredAt;
  // Legacy delivered orders may only carry an updatedAt timestamp.
  return toEpochMs(order?.updatedAt);
}

export function getEtaDeadline(order) {
  const readyAt = getReadyAt(order);
  if (readyAt == null) return null;
  return readyAt + getEtaMinutes(order) * 60000;
}

export function formatOrderDateTime(value) {
  const time = toEpochMs(value);
  if (time == null) return "—";
  return new Date(time).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Live mm:ss countdown to `targetTime` (epoch ms), or a zeroed value if null. */
export function useCountdown(targetTime) {
  const target = Number.isFinite(targetTime) ? targetTime : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    setNow(current);
    if (target == null || current >= target) return undefined;

    const intervalId = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= target) clearInterval(intervalId);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [target]);

  if (target == null) {
    return { totalMs: 0, minutes: 0, seconds: 0, isExpired: false, label: "00:00" };
  }

  const totalMs = Math.max(0, target - now);
  // Round remaining whole seconds up so the label never reads 00:00 while live.
  const remainingSeconds = Math.max(0, Math.ceil(totalMs / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  return {
    totalMs,
    minutes,
    seconds,
    isExpired: now >= target,
    label: `${pad(minutes)}:${pad(seconds)}`,
  };
}
