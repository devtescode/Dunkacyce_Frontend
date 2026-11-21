import { cn } from "@/lib/utils";

export function AdminPanel({ as = "section", className, children, ...rest }) {
  const Component = as;

  return (
    <Component
      className={cn(
        "rounded-2xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-sm sm:rounded-3xl",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
