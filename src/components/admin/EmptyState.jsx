import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <h3 className="font-display text-xl uppercase tracking-wide text-foreground sm:text-2xl">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
