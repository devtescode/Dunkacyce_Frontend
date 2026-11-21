import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  Clock,
  FileImage,
  FolderOpen,
  ImagePlus,
  Images,
  LayoutGrid,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  UploadCloud,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-image-upload")({
  head: () => ({ meta: [{ title: "Image Upload — Dunnkayce Admin" }] }),
  component: ImageUploadPage,
});

const plannedFeatures = [
  {
    icon: UploadCloud,
    title: "Fast bulk uploads",
    description:
      "Drag in multiple food photos at once, with smart compression and instant previews before publishing.",
  },
  {
    icon: FolderOpen,
    title: "Organized asset library",
    description:
      "Keep images grouped by category, meal type, and campaign so the right visual is always easy to find.",
  },
  {
    icon: Wand2,
    title: "Polished image presets",
    description:
      "Apply consistent cropping and framing rules for menu cards, banners, and promotional placements.",
  },
  {
    icon: ShieldCheck,
    title: "Safe media workflow",
    description:
      "Review, replace, and archive assets with confidence before they appear anywhere on the student menu.",
  },
];

const mockAssets = [
  {
    name: "Jollof Rice Hero",
    category: "Foods",
    status: "Preview",
    accent: "from-orange-500/25 via-amber-400/10 to-transparent",
    icon: ImagePlus,
  },
  {
    name: "Grilled Chicken",
    category: "Protein",
    status: "Draft",
    accent: "from-rose-500/20 via-orange-400/10 to-transparent",
    icon: FileImage,
  },
  {
    name: "Campus Combo Banner",
    category: "Campaign",
    status: "Planned",
    accent: "from-primary/25 via-primary/5 to-transparent",
    icon: Images,
  },
  {
    name: "Soup Collection",
    category: "Foods",
    status: "Preview",
    accent: "from-emerald-500/20 via-teal-400/10 to-transparent",
    icon: LayoutGrid,
  },
];

const workflowSteps = [
  {
    label: "Upload",
    detail: "Drop images into the studio",
  },
  {
    label: "Tag",
    detail: "Assign category and usage",
  },
  {
    label: "Review",
    detail: "Preview before publishing",
  },
];

function ImageUploadPage() {
  return (
    <AdminShell
      eyebrow="Media Studio"
      title="Image Upload"
      description="A dedicated space for managing food photography, campaign visuals, and reusable media assets across the Dunnkayce admin experience."
      actions={
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-4 w-4" />
          Coming soon
        </div>
      }
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.16),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.12),_transparent_38%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                In development
              </div>
              <div className="space-y-3">
                <h2 className="max-w-3xl font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  The media studio is being crafted for a premium upload experience.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This page is a visual preview of the upcoming image management
                  workflow. It is not connected to the backend yet, so uploads,
                  edits, and asset actions are intentionally disabled.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-5 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                    Studio status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    Preview mode only
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Images className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Backend connection</span>
                  <span className="font-medium text-foreground">Not connected</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Uploads</span>
                  <span className="font-medium text-foreground">Disabled</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Asset actions</span>
                  <span className="font-medium text-foreground">Preview only</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Upload zone
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  Drop food images here
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  The future upload area will support quick drag-and-drop,
                  image previews, and quality checks before assets reach the menu.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                Preview interface
              </span>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-dashed border-primary/25 bg-[linear-gradient(180deg,rgba(249,115,22,0.08),rgba(255,255,255,0)_55%),linear-gradient(135deg,rgba(255,255,255,0.02),rgba(249,115,22,0.04))] p-6 sm:p-8">
              <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <div className="rounded-3xl border border-primary/15 bg-background/80 p-4 text-primary shadow-sm">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p className="mt-5 text-lg font-semibold text-foreground">
                  Drag and drop images, or browse files
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Planned support for PNG, JPG, and WebP. Smart cropping and
                  file optimization will happen here before publishing.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-primary/60 px-5 py-2.5 text-sm font-semibold text-primary-foreground opacity-70"
                    aria-disabled="true"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Select files
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-border/70 bg-background/60 px-5 py-2.5 text-sm font-semibold text-muted-foreground opacity-70"
                    aria-disabled="true"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Browse library
                  </button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Upload controls are disabled until backend integration is ready.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
              Planned capabilities
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Built for everyday menu operations
            </h3>
            <div className="mt-6 space-y-4">
              {plannedFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex gap-4 rounded-2xl border border-border/60 bg-background/60 p-4"
                  >
                    <div className="mt-0.5 rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                Asset library preview
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                Organize visuals with clarity
              </h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Below is a static preview of how media assets could be browsed
                and organized. These sample cards are illustrative and not loaded
                from the backend.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-muted-foreground sm:min-w-[240px]">
                <Search className="h-4 w-4" />
                <span>Search assets (preview)</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>All categories</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mockAssets.map((asset) => {
              const Icon = asset.icon;
              return (
                <article
                  key={asset.name}
                  className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/60 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div
                    className={`relative flex aspect-[4/3] items-end overflow-hidden bg-gradient-to-br ${asset.accent}`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.02)_45%,rgba(0,0,0,0.18))]" />
                    <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-background/70 p-2.5 text-primary shadow-sm backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="relative p-4">
                      <span className="inline-flex rounded-full border border-white/15 bg-background/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur">
                        {asset.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {asset.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {asset.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Static sample
                      </span>
                      <span>Not stored</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary w-fit">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">Premium presentation</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Designed to match the admin system with clean spacing, soft depth,
              and clear visual hierarchy.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">Clear expectations</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every action is labeled as preview or disabled so admins know this
              feature is not live yet.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary w-fit">
              <Clock className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">Ready for integration</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The layout leaves room for real upload, tagging, and asset
              management once backend endpoints are available.
            </p>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
