import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api";
import { getAdminSocket } from "@/lib/socket";

const PAYMENT_EVENTS = ["payment_confirmed", "payment:received"];
const seenPayments = new Set();

function getPaymentKey(payload = {}) {
  return (
    payload.reference ||
    payload.orderId ||
    payload?.order?._id ||
    payload?.order?.id ||
    null
  );
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const socket = getAdminSocket();
    if (!socket) return undefined;

    const handlePaymentConfirmed = (payload = {}) => {
      const dedupeKey = getPaymentKey(payload);
      if (dedupeKey) {
        if (seenPayments.has(dedupeKey)) return;
        seenPayments.add(dedupeKey);
      }

      const amount = formatAmount(payload.amountPaid ?? payload.total ?? 0);
      const studentName = getStudentName(payload);
      const hostel = payload.hostel || payload?.order?.hostel || "Unknown hostel";
      const room = payload.room || payload?.order?.room || "Unknown room";
      const message = `Payment received: ₦${amount} from ${studentName} (${hostel}, Room ${room})`;

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

  return null;
}
