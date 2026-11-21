import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  PreviewBadge,
  PreviewBanner,
  SectionHeading,
  StatusPill,
} from "@/components/admin";
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
  head: () => ({
    meta: [
      { title: "Change Password — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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
        <>
          <PreviewBadge
            label="Backend pending"
            className="border-gold/60 bg-gold/15 text-gold shadow-sm dark:text-gold"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-warning/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold shadow-sm">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Not connected
          </span>
        </>
      }
    >
      <div className="space-y-6">
        <PreviewBanner
          title="Password updates are not connected yet"
          description="This admin screen is being prepared for a secure password-change flow. Until a backend endpoint is wired up, the form below remains a visual preview only and cannot save, submit, or modify credentials."
          statusRows={[
            { label: "Status", value: "Not connected" },
            { label: "Form action", value: "Disabled" },
            { label: "Data changes", value: "None" },
          ]}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-warning/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800 shadow-sm dark:text-amber-200">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gold" />
            Coming soon
          </span>
          <StatusPill tone="rose" dot={false}>
            <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Form disabled
          </StatusPill>
        </PreviewBanner>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="min-w-0" aria-labelledby="password-form-heading">
            <AdminPanel className="p-5 sm:p-7">
              <div id="password-form-heading">
                <SectionHeading
                  eyebrow="Interface preview"
                  title="Password update form"
                  description="Preview the planned layout. Fields are disabled and the action below does not submit any request."
                  action={
                    <>
                      <PreviewBadge label="Sample form" />
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        <EyeOff aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        Preview only
                      </span>
                    </>
                  }
                />
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
                      <KeyRound
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="password"
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        className="admin-focus w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground disabled:placeholder:text-muted-foreground"
                      />
                    </div>
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">New password</span>
                      <div className="relative mt-2">
                        <Lock
                          aria-hidden="true"
                          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="password"
                          placeholder="Create a new password"
                          autoComplete="new-password"
                          className="admin-focus w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground disabled:placeholder:text-muted-foreground"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-foreground">
                        Confirm new password
                      </span>
                      <div className="relative mt-2">
                        <ShieldCheck
                          aria-hidden="true"
                          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          autoComplete="new-password"
                          className="admin-focus w-full rounded-2xl border border-input bg-background/70 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground disabled:placeholder:text-muted-foreground"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gold/45 bg-warning/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p id="password-preview-note" className="text-sm leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">No action available:</span>{" "}
                      secure password saving will be enabled after backend integration.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="admin-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
                      Save password unavailable
                    </button>
                  </div>
                </fieldset>
              </form>
            </AdminPanel>
          </section>

          <aside className="min-w-0 space-y-6" aria-label="Preview details">
            <AdminPanel className="p-5 sm:p-7">
              <SectionHeading
                eyebrow="Planned capability"
                title="What secure updates will include"
                action={<PreviewBadge label="Planned only" />}
              />

              <div className="mt-5 space-y-4">
                {readinessItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <AdminPanel
                      as="article"
                      key={item.title}
                      className="border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <StatusPill tone="neutral" dot={false} className="shrink-0">
                              Preview
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </AdminPanel>
                  );
                })}
              </div>
            </AdminPanel>

            <AdminPanel className="bg-background/70 p-5 sm:p-7">
              <SectionHeading
                eyebrow="Security readiness"
                title="Password best practices"
                action={<PreviewBadge label="Sample guidance" />}
              />

              <ul className="mt-5 space-y-3">
                {bestPractices.map((practice) => (
                  <li
                    key={practice}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-2xl border border-gold/40 bg-warning/10 px-4 py-3 text-sm leading-6">
                <span className="font-semibold text-foreground">Security note:</span>{" "}
                <span className="text-muted-foreground">
                  avoid sharing temporary credentials over chat. Once live, password changes should
                  be completed only through this secured admin flow.
                </span>
              </div>
            </AdminPanel>
          </aside>
        </div>

        <AdminPanel
          as="footer"
          className="relative isolate overflow-hidden border-dashed border-gold/50 bg-warning/[0.06] p-5 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="preview-stripe pointer-events-none absolute inset-x-0 top-0 h-1.5"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <PreviewBadge label="Preview · no credentials accepted" className="h-fit shrink-0" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Preview only — no password changes can be submitted
                </p>
                <p className="max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                  This screen is a non-functional design preview with a sample layout and disabled
                  controls. No backend endpoint is connected, no credentials are collected or
                  stored, and nothing here changes an account. It stays hidden from navigation and
                  is excluded from search indexing.
                </p>
              </div>
            </div>
            <StatusPill tone="gold" dot={false} className="w-fit shrink-0">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              No live endpoint
            </StatusPill>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
