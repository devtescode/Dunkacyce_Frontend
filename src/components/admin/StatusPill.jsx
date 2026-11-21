import { cn } from "@/lib/utils";
import { resolveTone } from "./toneClasses";

export function StatusPill({ children, tone = "neutral", dot = true, className }) {
  const colors = resolveTone(tone);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        colors.pill,
        className,
      )}
    >
      {dot ? (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
      ) : null}
      {children}
    </span>
  );
}
