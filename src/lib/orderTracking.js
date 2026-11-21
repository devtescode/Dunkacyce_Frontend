import { useEffect, useState } from "react";

export const FULFILLMENT_STATUSES = ["Pending", "Preparing", "Ready", "Delivered"];

export const DEFAULT_ETA_MINUTES = 8;

function toEpochMs(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^-?\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    }
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Canonicalizes case/whitespace variations, defaulting unknown values. */
export function normalizeStatus(order) {
  const value = String(order?.status ?? "")
    .trim()
    .toLowerCase();
  const match = FULFILLMENT_STATUSES.find((status) => status.toLowerCase() === value);
  return match || "Preparing";
}

export function getReadyAt(order) {
  return toEpochMs(order?.readyAt);
}

export function getDeliveredAt(order) {
  const deliveredAt = toEpochMs(order?.deliveredAt);
  if (deliveredAt != null) return deliveredAt;
  // Legacy delivered orders may only carry an updatedAt timestamp.
  if (normalizeStatus(order) === "Delivered") return toEpochMs(order?.updatedAt);
  return null;
}

export function getEtaDeadline(order) {
  const readyAt = getReadyAt(order);
  if (readyAt == null) return null;
  const etaMinutes = Number(order?.etaMinutes) || DEFAULT_ETA_MINUTES;
  return readyAt + etaMinutes * 60000;
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
    setNow(Date.now());
    if (target == null) return undefined;

    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [target]);

  if (target == null) {
    return { totalMs: 0, minutes: 0, seconds: 0, isExpired: false, label: "00:00" };
  }

  const totalMs = Math.max(0, target - now);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const pad = (value) => String(value).padStart(2, "0");

  return {
    totalMs,
    minutes,
    seconds,
    isExpired: now >= target,
    label: `${pad(minutes)}:${pad(seconds)}`,
  };
}
