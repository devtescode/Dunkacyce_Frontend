import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy bookmark alias — the Super Admin page is the single canonical route. */
export const Route = createFileRoute("/admin-dashboard-admins")({
  head: () => ({
    meta: [
      { title: "Super Admin — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin-dashboard-superadmin", replace: true });
  },
  component: () => null,
});
