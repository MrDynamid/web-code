"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { discountPercent, formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { StarRating } from "@/components/star-rating";
import { WishlistButton } from "@/components/wishlist-button";
import { SmartImage } from "@/components/smart-image";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const off = discountPercent(product.price, product.compare_at_price);
  const singleSize = product.sizes.length <= 1;
  const soldOut = product.stock <= 0;
  const [loaded, setLoaded] = useState(false);

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        {/*
          The hover animation lives entirely on the image. The frame itself stays
          perfectly still — no card lift, no shadow, no layout shift — so nothing
          around the image can reflow mid-transition. That's what makes the
          motion read as smooth: one GPU-composited transform on one element.
        */}
        <div className="relative overflow-hidden rounded-lg bg-secondary">
          <SmartImage
            ref={(node) => {
              // If the browser already had the image cached, `onLoad` may never
              // fire after hydration — reconcile from `complete` on mount.
              if (node?.complete) setLoaded(true);
            }}
            src={product.images[0] ?? "/images/hero.jpg"}
            alt={product.name}
            width={1024}
            height={1280}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              // Two separate durations on purpose: the 800ms opacity reveal reads
              // as unhurried and luxurious, while the zoom has to answer the
              // cursor immediately, so it runs at 620ms. Sharing one duration
              // made hover feel laggy and let an in-flight reveal fight the
              // first zoom. Only `opacity` and `transform` animate — animating
              // `filter`/blur alongside them is what made this janky before.
              "aspect-[4/5] w-full transform-gpu object-cover object-center backface-hidden",
              "[transition:opacity_800ms_var(--ease-silk),transform_620ms_var(--ease-silk)]",
              "group-hover:scale-[1.05] group-focus-visible:scale-[1.05]",
              "motion-reduce:transform-none motion-reduce:[transition:opacity_800ms_linear]",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-silk group-hover:opacity-100" />

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badge ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase text-ink-foreground">
                {product.badge}
              </span>
            ) : null}
            {off ? (
              <span className="rounded-full bg-gradient-gold px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase text-gold-foreground">
                {off}% off
              </span>
            ) : null}
            {soldOut ? (
              <span className="rounded-full bg-card/95 px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase text-muted-foreground backdrop-blur">
                Sold out
              </span>
            ) : null}
          </div>

          <div className="absolute right-3 top-3 -translate-y-1 opacity-0 transition-all duration-500 ease-silk group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
            <WishlistButton slug={product.slug} />
          </div>

          {soldOut ? null : (
            <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-silk delay-[60ms] group-hover:translate-y-0 group-hover:opacity-100 max-sm:hidden">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  if (!singleSize) return;
                  add({
                    slug: product.slug,
                    name: product.name,
                    image: product.images[0] ?? "",
                    price: product.price,
                    size: product.sizes[0] ?? "Free Size",
                    color: product.colors[0] ?? "As shown",
                    quantity: 1,
                  });
                  toast.success(`${product.name} added to bag`);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-card/95 py-2.5 text-xs tracking-[0.14em] uppercase text-foreground backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <ShoppingBag width={14} height={14} strokeWidth={1.6} />
                {singleSize ? "Quick add" : "Select size"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="font-display text-lg leading-snug transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <StarRating value={Number(product.rating)} size={12} />
            <span className="truncate">
              {Number(product.rating).toFixed(1)}
              {product.review_count > 0 ? ` · ${product.review_count} reviews` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <span className="text-sm font-medium">{formatINR(product.price)}</span>
            {product.compare_at_price ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(product.compare_at_price)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
