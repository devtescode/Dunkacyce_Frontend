import { useEffect, useState } from "react";

export const FULFILLMENT_STATUSES = ["Pending", "Preparing", "Ready", "Delivered"];

export const DEFAULT_ETA_MINUTES = 8;

// When the arrival countdown has one minute (or less) left, a Ready order is
// shown as "On the way". This is a live UI state derived from readyAt + ETA;
// it never rewrites the stored backend status.
export const ON_THE_WAY_WINDOW_MS = 60_000;

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

/** Parses a persisted non-negative millisecond/duration value. */
function toNonNegativeMs(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
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

/** True only for a Ready order whose arrival countdown has reached its final minute. */
export function isOnTheWayByEta(order, now = Date.now()) {
  if (String(normalizeStatus(order)).toLowerCase() !== "ready") return false;
  const deadline = getEtaDeadline(order);
  if (deadline == null) return false;
  const remaining = deadline - now;
  // An overdue order is late, not "on the way"; it no longer matches this state.
  return remaining > 0 && remaining <= ON_THE_WAY_WINDOW_MS;
}

/** Status used for display: Ready orders in their final ETA minute read "On the way". */
export function getDisplayStatus(order, now = Date.now()) {
  return isOnTheWayByEta(order, now) ? "On the way" : normalizeStatus(order);
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

/** Live mm:ss countdown to `targetTime` (epoch ms), plus a count-up after it expires. */
export function useCountdown(targetTime) {
  const target = Number.isFinite(targetTime) ? targetTime : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    setNow(current);
    if (target == null) return undefined;

    // Keep ticking after the deadline so `elapsedMs` / `lateLabel` stay live.
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [target]);

  const pad = (value) => String(value).padStart(2, "0");

  if (target == null) {
    return {
      now,
      totalMs: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      label: "00:00",
      elapsedMs: 0,
      lateLabel: "00:00",
    };
  }

  const totalMs = Math.max(0, target - now);
  const elapsedMs = Math.max(0, now - target);
  // Round remaining whole seconds up so the label never reads 00:00 while live.
  const remainingSeconds = Math.max(0, Math.ceil(totalMs / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // Count-up seconds are also rounded up so the late label moves on the first tick past zero.
  const elapsedSeconds = Math.max(0, Math.ceil(elapsedMs / 1000));
  const lateMinutes = Math.floor(elapsedSeconds / 60);
  const lateSeconds = elapsedSeconds % 60;

  return {
    now,
    totalMs,
    minutes,
    seconds,
    isExpired: now >= target,
    label: `${pad(minutes)}:${pad(seconds)}`,
    elapsedMs,
    lateLabel: `${pad(lateMinutes)}:${pad(lateSeconds)}`,
  };
}

/** Compact human duration, e.g. 44s, 3m 04s, 1h 02m. */
export function formatDuration(ms) {
  if (ms == null) return "0s";
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return "0s";

  const totalSeconds = Math.floor(value / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const pad = (part) => String(part).padStart(2, "0");
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${pad(seconds)}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${pad(minutes % 60)}m`;
}

/** Delivery timing evidence, preferring the values persisted by the backend. */
export function getDeliveryEvidence(order, now = Date.now()) {
  const deliveredAt = getDeliveredAt(order);

  // The persisted ETA inputs are the ones that were actually used for this order;
  // they may differ from live fields if an ETA was edited after delivery.
  let deadlineAt = toEpochMs(order?.etaDeadlineAt);
  if (deadlineAt == null) {
    const readyAtUsed = toEpochMs(order?.readyAtUsed);
    if (readyAtUsed != null) {
      deadlineAt =
        readyAtUsed + (toNonNegativeMs(order?.etaMinutesUsed) ?? getEtaMinutes(order)) * 60000;
    } else {
      deadlineAt = getEtaDeadline(order);
    }
  }

  const hasTiming = deadlineAt != null && deliveredAt != null;
  const derivedLateByMs = hasTiming ? Math.max(0, deliveredAt - deadlineAt) : 0;
  const derivedEarlyByMs = hasTiming ? Math.max(0, deadlineAt - deliveredAt) : 0;
  const persistedLateByMs = toNonNegativeMs(order?.lateByMs);
  const persistedOnTime =
    typeof order?.deliveredBeforeDeadline === "boolean" ? order.deliveredBeforeDeadline : null;

  // The persisted verdict wins; magnitudes are reconciled so an "on time" order
  // can never also claim lateness (and vice versa).
  let lateByMs = persistedLateByMs ?? derivedLateByMs;
  let earlyByMs = derivedEarlyByMs;
  if (persistedOnTime === true) {
    lateByMs = 0;
  } else if (persistedOnTime === false) {
    earlyByMs = 0;
    if (persistedLateByMs == null) lateByMs = derivedLateByMs;
  } else if (persistedLateByMs != null && persistedLateByMs > 0) {
    earlyByMs = 0;
  }

  const hasVerdict = hasTiming || persistedOnTime != null || persistedLateByMs != null;
  const onTime = persistedOnTime ?? (hasVerdict ? lateByMs === 0 : null);

  let verdict = "unknown";
  let summary = "Delivery time not recorded";

  if (hasVerdict && onTime !== null) {
    verdict = onTime ? "on_time" : "late";
    if (!onTime) {
      summary = lateByMs > 0 ? `Delivered ${formatDuration(lateByMs)} late` : "Delivered late";
      if (!hasTiming) summary += " · exact time not recorded";
    } else if (earlyByMs > 0) {
      summary = `Delivered ${formatDuration(earlyByMs)} early`;
    } else {
      summary = "Delivered on time";
      if (!hasTiming) summary += " · exact time not recorded";
    }
  }

  return {
    hasTiming,
    deliveredAt,
    deadlineAt,
    onTime,
    lateByMs,
    earlyByMs,
    verdict,
    summary,
  };
}

/** How long a still-open order has run past its ETA; 0 when delivered or untimed. */
export function getLateElapsedMs(order, now = Date.now()) {
  if (normalizeStatus(order) === "Delivered") return 0;
  const deadline = getEtaDeadline(order);
  if (deadline == null) return 0;
  const current = Number.isFinite(now) ? now : Date.now();
  return Math.max(0, current - deadline);
}
