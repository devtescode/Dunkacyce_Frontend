import { forwardRef, useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchField = forwardRef(function SearchField(
  { id, label = "Search", placeholder, value, onChange, className, ...inputProps },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        {...inputProps}
        ref={ref}
        id={inputId}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      />
    </div>
  );
});
