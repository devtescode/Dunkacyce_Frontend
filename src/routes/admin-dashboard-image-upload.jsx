import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import {
  AdminPanel,
  FoodImage,
  PreviewBadge,
  PreviewBanner,
  SectionHeading,
  StatusPill,
} from "@/components/admin";
import { FOOD_HIGHLIGHTS } from "@/lib/foodImages";
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
  head: () => ({
    meta: [
      { title: "Image Upload — Dunnkayce Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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
      actions={<PreviewBadge label="Coming soon" />}
    >
      <div className="space-y-6">
        <PreviewBanner
          title="Media studio · visual preview"
          description="This page is a visual preview of the upcoming image management workflow. It is not connected to the backend yet, so uploads, edits, and asset actions are intentionally disabled."
          statusRows={[
            { label: "Studio status", value: "Preview mode only" },
            { label: "Backend connection", value: "Not connected" },
            { label: "Uploads", value: "Disabled" },
            { label: "Asset actions", value: "Preview only" },
          ]}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-warning/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            In development
          </span>
        </PreviewBanner>

        <AdminPanel className="p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="admin-eyebrow">Planned workflow</p>
            <p className="text-xs text-muted-foreground">
              Illustrative steps only — nothing here runs.
            </p>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <li
                key={step.label}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold ring-4 ring-gold/20"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-foreground">
                    {step.label}
                  </span>
                  <span className="block text-xs leading-5 text-muted-foreground">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </AdminPanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <AdminPanel className="p-5 sm:p-7">
            <SectionHeading
              eyebrow="Upload zone"
              title="Drop food images here"
              description="The future upload area will support quick drag-and-drop, image previews, and quality checks before assets reach the menu."
              action={<PreviewBadge label="Preview interface" />}
            />

            <div className="mt-6 rounded-[1.75rem] border border-dashed border-gold/50 bg-gradient-to-br from-warning/10 via-card/60 to-card/60 p-6 sm:p-8">
              <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <div className="rounded-3xl border border-gold/40 bg-warning/15 p-4 text-forest-deep shadow-sm dark:text-gold">
                  <UploadCloud aria-hidden="true" className="h-8 w-8" />
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
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white opacity-75 shadow-sm"
                  >
                    <ImagePlus aria-hidden="true" className="h-4 w-4" />
                    Select files
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground opacity-75"
                  >
                    <FolderOpen aria-hidden="true" className="h-4 w-4" />
                    Browse library
                  </button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Upload controls are disabled until backend integration is ready.
                </p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel className="p-5 sm:p-7">
            <SectionHeading
              eyebrow="Planned capabilities"
              title="Built for everyday menu operations"
            />
            <div className="mt-6 space-y-4">
              {plannedFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex gap-4 rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="mt-0.5 rounded-2xl bg-forest/10 p-2.5 text-forest dark:text-fresh">
                      <Icon aria-hidden="true" className="h-5 w-5" />
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
          </AdminPanel>
        </div>

        <AdminPanel className="p-5 sm:p-7">
          <SectionHeading
            eyebrow="Asset library preview"
            title="Organize visuals with clarity"
            description="Below is a static preview of how media assets could be browsed and organized. These sample cards are illustrative and not loaded from the backend."
            action={
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-muted-foreground sm:min-w-[240px]">
                  <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>Search assets (preview)</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm text-muted-foreground">
                  <Tag aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>All categories</span>
                </div>
              </div>
            }
          />

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <PreviewBadge label="Static sample photography · Not stored" />
            <p className="text-xs text-muted-foreground">
              Curated stock photos are shown for layout only — never uploaded menu assets.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mockAssets.map((asset, index) => {
              const Icon = asset.icon;
              const samplePhoto = FOOD_HIGHLIGHTS[index % FOOD_HIGHLIGHTS.length];
              return (
                <article
                  key={asset.name}
                  className="group overflow-hidden rounded-3xl border border-border/70 bg-background/60 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="relative">
                    <FoodImage
                      src={samplePhoto.src}
                      alt={`Static sample food photo for ${asset.name}`}
                      ratio="aspect-[4/3]"
                      seed={asset.name}
                    />
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                      <span className="rounded-2xl border border-gold/40 bg-forest-deep/85 p-2 text-gold shadow-sm">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-forest-deep/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                        Static sample
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-x-3 bottom-3">
                      <span className="inline-flex rounded-full bg-background/90 p-0.5 shadow-sm backdrop-blur">
                        <StatusPill tone="gold">{asset.status}</StatusPill>
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
                        <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />
                        Static sample
                      </span>
                      <span>Not stored</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel
          as="div"
          className="border-dashed border-gold/50 bg-warning/10 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="w-fit rounded-2xl bg-warning/20 p-2.5 text-amber-700 dark:text-amber-200">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Preview mode only — no media is collected
                </p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  The photos above are curated static samples for layout
                  demonstration. They are not stored, not uploaded, and not
                  connected to any backend service. Every control on this page
                  is intentionally disabled or non-interactive.
                </p>
              </div>
            </div>
            <PreviewBadge label="Not stored" className="shrink-0" />
          </div>
        </AdminPanel>

        <section className="grid gap-4 md:grid-cols-3">
          <AdminPanel className="p-5">
            <div className="w-fit rounded-2xl bg-forest/10 p-2.5 text-forest dark:text-fresh">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">
              Premium presentation
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Designed to match the admin system with clean spacing, soft depth,
              and clear visual hierarchy.
            </p>
          </AdminPanel>
          <AdminPanel className="p-5">
            <div className="w-fit rounded-2xl bg-forest/10 p-2.5 text-forest dark:text-fresh">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">
              Clear expectations
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Every action is labeled as preview or disabled so admins know this
              feature is not live yet.
            </p>
          </AdminPanel>
          <AdminPanel className="p-5">
            <div className="w-fit rounded-2xl bg-forest/10 p-2.5 text-forest dark:text-fresh">
              <Clock aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-foreground">
              Ready for integration
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The layout leaves room for real upload, tagging, and asset
              management once backend endpoints are available.
            </p>
          </AdminPanel>
        </section>
      </div>
    </AdminShell>
  );
}
