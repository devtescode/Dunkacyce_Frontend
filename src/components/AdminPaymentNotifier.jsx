import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api";
import {
  isPaymentAudioRunning,
  isPaymentSoundEnabled,
  onPaymentAudioStateChange,
  playPaymentChime,
  primePaymentAudio,
  setPaymentSoundEnabled,
} from "@/lib/paymentSound";
import { getAdminSocket } from "@/lib/socket";

const PAYMENT_EVENTS = ["payment_confirmed", "payment:received"];
const seenPayments = new Set();
const MAX_SEEN_PAYMENTS = 500;
const PRIME_LISTENER_OPTIONS = { passive: true };

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function getPaymentKey(payload = {}) {
  // Real ids/references remain the primary dedupe key so the same payment is
  // still collapsed across both socket events.
  const primaryKey =
    payload.reference ||
    payload.orderId ||
    payload?.order?._id ||
    payload?.order?.id ||
    null;
  if (primaryKey) return primaryKey;

  // Anonymous payloads: build the key from invariant payment identity only.
  // Volatile fields (status, paymentStatus, fulfillmentStatus, itemCount, ...)
  // differ between the `payment_confirmed` and `payment:received` deliveries
  // of the same payment, so they must never participate in dedupe.
  const reference = payload.reference || payload?.order?.reference || null;
  const identity = {
    amount: payload.amountPaid ?? payload.total ?? null,
    paidAt: payload.paidAt || reference || null,
    hostel: payload.hostel || payload?.order?.hostel || null,
    room: payload.room || payload?.order?.room || null,
    userId: payload.userId || payload?.user?.id || payload?.user?._id || null,
  };
  const hasIdentity = Object.values(identity).some(
    (field) => field !== undefined && field !== null && field !== "",
  );

  // Both prefixes use the same invariant identity object; the labels only
  // preserve the original distinction between partial and fully empty keys.
  return `${hasIdentity ? "synthetic" : "fingerprint"}:${stableStringify(identity)}`;
}

function markPaymentSeen(key) {
  if (seenPayments.has(key)) return false;
  seenPayments.add(key);
  if (seenPayments.size > MAX_SEEN_PAYMENTS) {
    // Sets keep insertion order, so the first entry is the oldest one.
    seenPayments.delete(seenPayments.values().next().value);
  }
  return true;
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString("en-NG");
}

function getStudentName(payload = {}) {
  return (
    payload?.student?.fullName ||
    payload?.student?.name ||
    payload?.user?.fullName ||
    payload?.user?.name ||
    "a student"
  );
}

function showBrowserNotification(message) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification("Payment received", { body: message });
  } catch {
    // Ignore browser notification failures; toast is the primary alert.
  }
}

export function AdminPaymentNotifier() {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(() => isPaymentSoundEnabled());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let listenersAttached = false;

    function handleUserGesture() {
      primePaymentAudio();
      syncPrimeListeners();
    }

    function attachPrimeListeners() {
      if (listenersAttached) return;
      window.addEventListener("pointerdown", handleUserGesture, PRIME_LISTENER_OPTIONS);
      window.addEventListener("keydown", handleUserGesture, PRIME_LISTENER_OPTIONS);
      listenersAttached = true;
    }

    function removePrimeListeners() {
      if (!listenersAttached) return;
      window.removeEventListener("pointerdown", handleUserGesture, PRIME_LISTENER_OPTIONS);
      window.removeEventListener("keydown", handleUserGesture, PRIME_LISTENER_OPTIONS);
      listenersAttached = false;
    }

    function syncPrimeListeners() {
      // Keep priming until audio is actually running. If it becomes
      // suspended/interrupted again, the state change re-arms the listeners.
      if (isPaymentAudioRunning()) removePrimeListeners();
      else attachPrimeListeners();
    }

    syncPrimeListeners();
    const unsubscribe = onPaymentAudioStateChange(syncPrimeListeners);

    return () => {
      unsubscribe();
      removePrimeListeners();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const socket = getAdminSocket();
    if (!socket) return undefined;

    const handlePaymentConfirmed = (payload = {}) => {
      if (!markPaymentSeen(getPaymentKey(payload))) return;

      const amount = formatAmount(payload.amountPaid ?? payload.total ?? 0);
      const studentName = getStudentName(payload);
      const hostel = payload.hostel || payload?.order?.hostel || "Unknown hostel";
      const room = payload.room || payload?.order?.room || "Unknown room";
      const message = `Payment received: ₦${amount} from ${studentName} (${hostel}, Room ${room})`;

      if (isPaymentSoundEnabled()) playPaymentChime();

      toast.success("Payment received", {
        description: message,
        duration: 8000,
      });

      showBrowserNotification(message);

      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dashboardStats(),
      });
    };

    PAYMENT_EVENTS.forEach((event) => socket.on(event, handlePaymentConfirmed));

    return () => {
      PAYMENT_EVENTS.forEach((event) =>
        socket.off(event, handlePaymentConfirmed),
      );
    };
  }, [queryClient]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setPaymentSoundEnabled(next);
    setSoundEnabled(next);
    if (next) primePaymentAudio();
  };

  return (
    <button
      type="button"
      onClick={handleToggleSound}
      title={soundEnabled ? "Mute payment sound" : "Unmute payment sound"}
      aria-label="Payment sound"
      aria-pressed={soundEnabled}
      className="fixed right-4 bottom-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {soundEnabled ? (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <VolumeX className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
