import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const FilterSelect = forwardRef(function FilterSelect(
  { id, label, value, onChange, options = [], className, ...selectProps },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        {...selectProps}
        ref={ref}
        id={selectId}
        value={value}
        onChange={onChange}
        aria-label={label}
        className="w-full appearance-none rounded-xl border border-input bg-background py-2.5 pl-3 pr-9 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      >
        {(options ?? []).map((option, index) => (
          <option key={option.value ?? index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});
