import {
  AlertTriangle,
  CircleDollarSign,
  CookingPot,
  PackageCheck,
  Receipt,
  Truck,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const countFormatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCount(value) {
  return countFormatter.format(toNumber(value));
}

function formatCurrency(value) {
  return currencyFormatter.format(toNumber(value));
}

const baseCardClass =
  "relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card/80 p-3.5 shadow-sm backdrop-blur-sm sm:p-4";

const iconTileClass = "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset";

export function OrderStatsBar({ stats, isPending = false }) {
  const source = stats ?? {};
  const lateCount = toNumber(source.late);
  const hasLate = lateCount > 0;

  const cards = [
    // {
    //   key: "paid-count",
    //   label: "Paid orders",
    //   value: formatCount(source.paidCount),
    //   hint: "Payments confirmed",
    //   icon: Receipt,
    //   iconClass: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    //   valueClass: "text-sky-700 dark:text-sky-300",
    // },
    {
      key: "paid-students",
      label: "Paid students",
      value: formatCount(source.paidStudents),
      hint: "Unique payers",
      icon: Users,
      iconClass: "bg-success/10 text-success ring-success/25",
      valueClass: "text-success",
    },
    {
      key: "students-to-deliver",
      label: "To deliver",
      value: formatCount(source.studentsToDeliver),
      hint: "Awaiting handoff",
      icon: UserRoundCheck,
      iconClass:
        "bg-warning/15 text-amber-700 ring-warning/40 dark:text-warning dark:ring-warning/30",
      valueClass: "text-amber-700 dark:text-warning",
    },
    // {
    //   key: "revenue",
    //   label: "Revenue",
    //   value: formatCurrency(source.revenue),
    //   hint: "Collected so far",
    //   icon: CircleDollarSign,
    //   iconClass: "bg-success/10 text-success ring-success/25",
    //   valueClass: "text-success",
    //   wideValue: true,
    // },
    {
      key: "preparing",
      label: "Preparing",
      value: formatCount(source.preparing),
      hint: "In the kitchen",
      icon: CookingPot,
      iconClass:
        "bg-warning/15 text-amber-700 ring-warning/40 dark:text-warning dark:ring-warning/30",
      valueClass: "text-amber-700 dark:text-warning",
    },
    {
      key: "ready",
      label: "Ready",
      value: formatCount(source.ready),
      hint: "Ready for pickup",
      icon: PackageCheck,
      iconClass: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
      valueClass: "text-sky-700 dark:text-sky-300",
    },
    {
      key: "delivered",
      label: "Delivered",
      value: formatCount(source.delivered),
      hint: "Completed drops",
      icon: Truck,
      iconClass: "bg-success/10 text-success ring-success/25",
      valueClass: "text-success",
    },
    {
      key: "late",
      label: "Late",
      value: formatCount(lateCount),
      hint: hasLate ? "Needs attention" : "On schedule",
      icon: AlertTriangle,
      iconClass:
        "bg-destructive/10 text-destructive ring-destructive/25 dark:text-destructive",
      valueClass: hasLate ? "text-destructive" : "text-muted-foreground",
      cardClass: hasLate
        ? "border-destructive/50 bg-destructive/5 ring-1 ring-destructive/20"
        : "border-border",
    },
  ];

  return (
    <section
      aria-label="Order statistics"
      aria-busy={isPending}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.key}
            aria-label={`${card.label}: ${card.value}. ${card.hint}.`}
            className={cn(baseCardClass, card.cardClass ?? "border-border")}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-muted-foreground">
                {card.label}
              </h3>
              <span aria-hidden="true" className={cn(iconTileClass, card.iconClass)}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </div>

            <div aria-live="polite" className="min-w-0 space-y-1">
              <p
                className={cn(
                  "font-display font-bold leading-none tabular-nums text-foreground",
                  card.wideValue ? "text-xl sm:text-2xl" : "text-3xl",
                  card.valueClass,
                  isPending && "opacity-60 animate-pulse motion-reduce:animate-none",
                )}
              >
                {card.value}
              </p>
              <p className="text-[11px] leading-4 text-muted-foreground">{card.hint}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default OrderStatsBar;
