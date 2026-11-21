import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, UtensilsCrossed } from "lucide-react";
import { DunnkayceLoader } from "@/components/DunnkayceLoader";
import { AdminPanel, StatusPill, ThemeToggle } from "@/components/admin";

export const Route = createFileRoute("/admin")({
  component: AdminEntryPage,
});

function AdminEntryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    const stored = sessionStorage.getItem("admin");

    let isAuthenticated = false;
    if (token && stored) {
      try {
        JSON.parse(stored);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    navigate({
      to: isAuthenticated ? "/admin-dashboard" : "/adminlogin",
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-forest/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl"
      />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <AdminPanel className="w-full max-w-xl overflow-hidden">
        <div className="relative isolate overflow-hidden bg-forest-deep px-6 py-8 text-white sm:px-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(248,210,111,0.22),transparent_45%),linear-gradient(150deg,var(--color-forest),var(--color-forest-deep))]"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <UtensilsCrossed className="h-5 w-5 text-gold" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  Dunnkayce
                </p>
                <p className="text-sm font-semibold leading-tight">Swift Campus Feast</p>
              </div>
            </div>
            <StatusPill
              tone="fresh"
              className="border-white/25 bg-white/10 text-white [&>span]:bg-fresh"
            >
              Secure portal
            </StatusPill>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/75">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Admin workspace
          </p>
        </div>

        <DunnkayceLoader
          variant="page"
          label="Opening admin portal"
          caption="Checking your session and taking you to the right place."
          className="min-h-[42vh] px-6 py-12 sm:px-10"
        />
      </AdminPanel>
    </div>
  );
}
