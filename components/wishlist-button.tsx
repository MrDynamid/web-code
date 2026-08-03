"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  slug,
  className,
  label = false,
}: {
  slug: string;
  className?: string;
  label?: boolean;
}) {
  const router = useRouter();
  const { isSaved, toggle, pending, isAuthenticated } = useWishlist();
  const saved = isSaved(slug);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isAuthenticated) {
          toast.info("Sign in to save pieces you love.");
          router.push(`/auth?redirect=${encodeURIComponent(`/product/${slug}`)}`);
          return;
        }
        toggle(slug);
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-xs backdrop-blur transition-all duration-300 hover:border-gold hover:text-primary disabled:opacity-60",
        className,
      )}
    >
      <Heart
        width={15}
        height={15}
        strokeWidth={1.6}
        className={cn("transition-all duration-300", saved && "fill-primary text-primary scale-110")}
      />
      {label ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
