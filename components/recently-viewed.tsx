"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";
import { readRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export function RecentlyViewed({
  catalogue,
  excludeSlug,
  title = "Recently viewed",
}: {
  catalogue: Product[];
  excludeSlug?: string;
  title?: string;
}) {
  const [slugs, setSlugs] = useState<string[]>([]);

  // Read after hydration so server and client markup match.
  useEffect(() => setSlugs(readRecentlyViewed()), []);

  const products = slugs
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => catalogue.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <Reveal>
        <h2 className="font-display text-3xl">{title}</h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={product.slug} delay={(index % 4) * 80}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
