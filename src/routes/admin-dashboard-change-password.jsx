import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  EyeOff,
  KeyRound,
  Lock,
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-change-password")({
  head: () => ({ meta: [{ title: "Change Password — Dunnkayce Admin" }] }),
  component: ChangePasswordPage,
});

const readinessItems = [
  {
    icon: ServerCog,
    title: "Secure backend endpoint",
    description:
      "Password changes will run through a dedicated, authenticated API endpoint with server-side validation.",
  },
  {
    icon: ShieldCheck,
    title: "Verification safeguards",
    description:
      "Current-password confirmation and secure credential handling will be required before any update is accepted.",
  },
  {
    icon: BadgeCheck,
    title: "Audit-ready account updates",
    description:
      "Once connected, successful password rotations can be tracked with clear admin feedback and security controls.",
  },
];

const bestPractices = [
  "Use a unique password that is not shared with other systems or accounts.",
  "Choose a long passphrase with letters, numbers, and a special character.",
  "Rotate credentials after team changes or any suspected security event.",
];

function ChangePasswordPage() {
  return (
    <AdminShell
      eyebrow="Account security"
      title="Change Password"
      description="Secure admin password updates are planned for this area, but the backend endpoint is not connected yet. This page is intentionally non-functional so no password changes are falsely submitted."
      actions={
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          <Clock3 className="h-4 w-4" />
          Backend pending
        </span>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-7">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-12 left-12 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-background/80 text-primary shadow-sm">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Coming soon
                </div>
                <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
                  Password updates are not connected yet
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This admin screen is being prepared for a secure password-change flow. Until a
                  backend endpoint is wired up, the form below remains a visual preview only and
                  cannot save, submit, or modify credentials.
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Status", value: "Not connected" },
                { label: "Form action", value: "Disabled" },
                { label: "Data changes", value: "None" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-7">
            <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Interface preview
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Password update form
                </h3>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Preview the planned layout. Fields are disabled and the action below does not
                  submit any request.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <EyeOff className="h-3.5 w-3.5" />
                Preview only
              </span>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => event.preventDefault()}
              aria-describedby="password-preview-note"
            >
              <fieldset disabled className="space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Current password</span>
                  <div className="relative mt-2">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <input
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">New password</span>
                    <div className="relative mt-2">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        type="password"
                        placeholder="Create a new password"
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Confirm new password</span>
                    <div className="relative mt-2">
                      <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p id="password-preview-note" className="text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">No action available:</span>{" "}
                    secure password saving will be enabled after backend integration.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary/60 px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Lock className="h-4 w-4" />
                    Save password unavailable
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ServerCog className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Planned capability
                </p>
                <h3 className="text-lg font-semibold text-foreground">What secure updates will include</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {readinessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-background/70 p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Security readiness
                </p>
                <h3 className="text-lg font-semibold text-foreground">Password best practices</h3>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {bestPractices.map((practice) => (
                <li
                  key={practice}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{practice}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">Security note:</span> avoid sharing
              temporary credentials over chat. Once live, password changes should be completed only
              through this secured admin flow.
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
