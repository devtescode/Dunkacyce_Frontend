import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PreviewBadge({ label = "Preview · Not connected", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-dashed border-gold/60 bg-warning/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 shadow-sm dark:text-amber-200",
        className,
      )}
    >
      <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gold" />
      {label}
    </span>
  );
}
