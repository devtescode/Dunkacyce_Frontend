import { AlertTriangle, Bike, CheckCircle2, Clock3, Timer } from "lucide-react";
import {
  formatDuration,
  getDeliveryEvidence,
  getDisplayStatus,
  getEtaDeadline,
  getLateElapsedMs,
  normalizeStatus,
  ON_THE_WAY_WINDOW_MS,
} from "@/lib/orderTracking";
import { cn } from "@/lib/utils";

const TONES = {
  fresh: {
    shell: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    detail: "text-emerald-600 dark:text-emerald-300/80",
    meta: "border-emerald-200/80 text-emerald-700/70 dark:border-emerald-500/20 dark:text-emerald-300/70",
  },
  destructive: {
    shell: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    detail: "text-rose-600 dark:text-rose-300/80",
    meta: "border-rose-200/80 text-rose-700/70 dark:border-rose-500/20 dark:text-rose-300/70",
  },
  sky: {
    shell: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    detail: "text-sky-600 dark:text-sky-300/80",
    meta: "border-sky-200/80 text-sky-700/70 dark:border-sky-500/20 dark:text-sky-300/70",
  },
  muted: {
    shell: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-300",
    detail: "text-slate-500 dark:text-slate-400",
    meta: "border-slate-200 text-slate-500 dark:border-slate-600/50 dark:text-slate-400",
  },
};

function textValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toEpoch(value) {
  if (value == null || textValue(value) === "") return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (/^-?\d+$/.test(textValue(value))) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function formatTimestamp(value) {
  const time = toEpoch(value);
  if (time == null) return null;
  return new Date(time).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toClock(ms) {
  const totalSeconds = Math.max(
    0,
    Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function DeliveryEvidenceBadge({
  order,
  now = Date.now(),
  variant = "compact",
}) {
  const current = Number.isFinite(now) ? now : Date.now();
  const evidence = (order ? getDeliveryEvidence(order, current) : null) ?? {};
  const {
    hasTiming = false,
    deliveredAt = null,
    deadlineAt: evidenceDeadline = null,
    onTime = false,
    lateByMs = 0,
    earlyByMs = 0,
    verdict = "unknown",
  } = evidence;

  const status = order ? getDisplayStatus(order, current) : "Preparing";
  const statusKey = String(status ?? "").toLowerCase();
  const baseStatus = String(normalizeStatus(order) ?? "").toLowerCase();
  const isDelivered = baseStatus === "delivered";
  // "On the way" can arrive from the backend as a real status, so treat it as a
  // ready-family order instead of falling through to the neutral placeholder.
  const isReady = baseStatus === "ready" || statusKey === "on the way";

  // Persisted evidence (etaDeadlineAt / readyAtUsed) is authoritative for a
  // delivered order; only fall back to the live ETA for still-open orders.
  const deadlineAt = (isDelivered ? evidenceDeadline : null) ?? getEtaDeadline(order) ?? evidenceDeadline;
  const lateElapsedMs = order ? getLateElapsedMs(order, current) : 0;
  const remainingMs = deadlineAt == null ? null : Math.max(0, deadlineAt - current);
  const isLateReady =
    isReady && deadlineAt != null && Number.isFinite(lateElapsedMs) && lateElapsedMs > 0;
  const isOnTheWay =
    statusKey === "on the way" ||
    (isReady && !isLateReady && remainingMs != null && remainingMs <= ON_THE_WAY_WINDOW_MS);

  let tone = TONES.muted;
  let Icon = Clock3;
  let label = "ETA starts at Ready";
  const details = [];

  if (isDelivered) {
    const deliveredLabel = formatTimestamp(deliveredAt);

    if (!hasTiming) {
      if (verdict === "late") {
        tone = TONES.destructive;
        Icon = AlertTriangle;
        label = lateByMs > 0 ? `Late by ${formatDuration(lateByMs)}` : "Delivered late";
      } else if (verdict === "on_time") {
        tone = TONES.fresh;
        Icon = CheckCircle2;
        label = "On time";
      } else {
        label = "Delivered · time recorded";
      }
      if (deliveredLabel) details.push(deliveredLabel);
    } else if (onTime) {
      tone = TONES.fresh;
      Icon = CheckCircle2;
      label = "On time";
      if (Number(earlyByMs) > 0) details.push(`${formatDuration(earlyByMs)} early`);
      if (deliveredLabel) details.push(deliveredLabel);
    } else {
      tone = TONES.destructive;
      Icon = AlertTriangle;
      label = `Late by ${formatDuration(lateByMs)}`;
      if (deliveredLabel) details.push(deliveredLabel);
    }
  } else if (isLateReady) {
    tone = TONES.destructive;
    Icon = AlertTriangle;
    label = `Late by ${toClock(lateElapsedMs)}`;
    details.push("past ETA");
  } else if (isReady) {
    tone = TONES.sky;
    if (isOnTheWay) {
      Icon = Bike;
      label = `On the way · ${toClock(remainingMs)} remaining`;
    } else {
      Icon = Timer;
      label = `Arriving in ${toClock(remainingMs)}`;
    }
  }

  const readyMs = toEpoch(order?.readyAt);
  const deliveryMs = toEpoch(deliveredAt);

  return (
    <div
      role="status"
      aria-label={[label, ...details].filter(Boolean).join(" · ")}
      className={cn(
        "inline-flex min-w-0 flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-left shadow-sm",
        tone.shell,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-tight">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>

      {details.length > 0 ? (
        <span className={cn("pl-5 text-[10px] font-medium leading-tight", tone.detail)}>
          {details.join(" · ")}
        </span>
      ) : null}

      {variant === "full" ? (
        <span
          className={cn(
            "mt-0.5 grid gap-0.5 border-t pt-1 text-[10px] leading-tight",
            tone.meta,
          )}
        >
          <span>Ready {formatTimestamp(readyMs) ?? "—"}</span>
          <span>Deadline {formatTimestamp(deadlineAt) ?? "—"}</span>
          <span>Delivered {formatTimestamp(deliveryMs) ?? "—"}</span>
        </span>
      ) : null}
    </div>
  );
}

export default DeliveryEvidenceBadge;
