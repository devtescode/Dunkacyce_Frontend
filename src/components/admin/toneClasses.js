/**
 * Shared tone maps for the admin kit.
 *
 * Keeping the maps here guarantees that StatCard and StatusPill paint identical
 * colours in both light and dark themes. Every class is built from semantic
 * tokens (or Tailwind's stable palette) so no hardcoded orange leaks in.
 */
export const toneClasses = {
  forest: {
    icon: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
    pill: "border-primary/25 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  fresh: {
    icon: "bg-success/15 text-success ring-1 ring-inset ring-success/25",
    pill: "border-success/30 bg-success/15 text-success",
    dot: "bg-success",
  },
  gold: {
    icon: "bg-warning/20 text-amber-700 ring-1 ring-inset ring-warning/40 dark:text-amber-200",
    pill: "border-warning/45 bg-warning/20 text-amber-800 dark:text-amber-200",
    dot: "bg-warning",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/25 dark:text-blue-300",
    pill: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-700 ring-1 ring-inset ring-violet-500/25 dark:text-violet-300",
    pill: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  rose: {
    icon: "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300",
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  neutral: {
    icon: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    pill: "border-border bg-muted/70 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export const TONE_NAMES = Object.keys(toneClasses);

/** Resolve a tone name to its class bundle, falling back to the neutral tone. */
export function resolveTone(tone) {
  return toneClasses[tone] ?? toneClasses.neutral;
}
