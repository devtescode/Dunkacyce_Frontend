import { useEffect, useRef, useState } from "react";
import { FOOD_FALLBACK_SVG, getFoodPhoto } from "@/lib/foodImages";
import { cn } from "@/lib/utils";

export function FoodImage({
  src,
  alt,
  className,
  ratio = "aspect-[4/3]",
  seed,
  loading = "lazy",
  referrerPolicy = "no-referrer",
  ...imgProps
}) {
  const resolvedSrc = src || getFoodPhoto({ name: alt, seed });
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const hasFallenBack = useRef(false);

  useEffect(() => {
    hasFallenBack.current = false;
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  const handleError = () => {
    if (hasFallenBack.current) return;
    hasFallenBack.current = true;
    setCurrentSrc(FOOD_FALLBACK_SVG);
  };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl bg-muted", ratio, className)}>
      <img
        {...imgProps}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy={referrerPolicy}
        onError={handleError}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
