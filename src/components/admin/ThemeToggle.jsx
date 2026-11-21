import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_ORDER = ["light", "dark", "system"];

const themeMeta = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  system: { label: "System", Icon: Monitor },
};

export function ThemeToggle({ compact = false, className }) {
  const { theme = "system", setTheme } = useTheme() ?? {};
  const current = themeMeta[theme] ? theme : "system";
  const { Icon, label } = themeMeta[current];
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  const nextLabel = themeMeta[nextTheme].label;

  return (
    <button
      type="button"
      onClick={() => setTheme?.(nextTheme)}
      aria-label={`Theme: ${label}. Switch to ${nextLabel}`}
      title={`Theme: ${label} — switch to ${nextLabel}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
        compact ? "h-9 w-9" : "px-3 py-2 text-xs font-semibold",
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
      {compact ? null : <span>{label}</span>}
    </button>
  );
}
