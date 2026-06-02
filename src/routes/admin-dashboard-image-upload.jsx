import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { CloudUpload, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard-image-upload")({
  head: () => ({ meta: [{ title: "Image Upload — Dunnkayce Admin" }] }),
  component: ImageUploadPage,
});

function ImageUploadPage() {
  return (
    <AdminShell
      title="Image Upload & Preview"
      description="Upload food images and preview them before posting. Keep visuals crisp and menu-ready."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_0.7fr]">
        <div className="rounded-3xl border border-input bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
            <CloudUpload className="h-5 w-5 text-primary" /> Upload new food image
          </div>

          <form className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Image URL</span>
              <input type="text" placeholder="https://..." className="mt-2 w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/70" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Upload file</span>
              <input type="file" className="mt-2 w-full text-sm text-muted-foreground" />
            </label>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              <ImagePlus className="h-4 w-4" /> Preview image
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-input bg-background p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Preview panel</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Live previews help you confirm image size, alt text, and menu presentation before publishing.
          </p>
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-input bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Preview {index + 1}</p>
                    <p className="text-sm text-muted-foreground">Food image with alt text and label.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
