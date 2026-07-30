import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { ScrollReveal } from '@/components/scroll-reveal'
import type { Product } from '@/lib/products'

export function ProductRail({
  eyebrow,
  title,
  viewAllHref,
  products,
  priority = false,
  wishlistedIds = [],
}: {
  eyebrow: string
  title: string
  viewAllHref: string
  products: Product[]
  priority?: boolean
  wishlistedIds?: number[]
}) {
  if (products.length === 0) return null

  const wishlisted = new Set(wishlistedIds)

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <ScrollReveal className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className="hidden text-sm text-foreground/80 underline-offset-4 transition-colors hover:text-gold hover:underline sm:block"
        >
          View all
        </Link>
      </ScrollReveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((product, i) => (
          <ScrollReveal key={product.id} direction="up" delay={(i % 4) * 100}>
            <ProductCard
              product={product}
              priority={priority && i < 4}
              wishlisted={wishlisted.has(product.id)}
            />
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
