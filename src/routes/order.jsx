import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy/bookmark alias. `/orders` is the canonical student tracking route.
 */
export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "My Orders — DUNNKAYCE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/orders", replace: true });
  },
  component: () => null,
});
