import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          width={size}
          height={size}
          strokeWidth={1.5}
          className={cn(
            "transition-colors",
            step <= Math.round(value) ? "fill-gold text-gold" : "text-border",
          )}
        />
      ))}
    </span>
  );
}