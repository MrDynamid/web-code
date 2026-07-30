import Image from 'next/image'
import Link from 'next/link'
import { ScrollReveal } from '@/components/scroll-reveal'

const CATEGORY_TILES = [
  {
    label: 'Dresses',
    href: '/products?category=Dresses',
    image: '/editorial/category-dresses.png',
    caption: 'Fluid silhouettes',
  },
  {
    label: 'Outerwear',
    href: '/products?category=Outerwear',
    image: '/editorial/category-outerwear.png',
    caption: 'Coats & tailoring',
  },
  {
    label: 'Knitwear',
    href: '/products?category=Knitwear',
    image: '/editorial/category-knitwear.png',
    caption: 'Cashmere & merino',
  },
]

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <ScrollReveal className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Shop by category
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            The edit
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden text-sm text-foreground/80 underline-offset-4 transition-colors hover:text-gold hover:underline sm:block"
        >
          View all
        </Link>
      </ScrollReveal>
      <div className="grid gap-4 md:grid-cols-3">
        {CATEGORY_TILES.map((tile, i) => (
          <ScrollReveal key={tile.label} direction="up" delay={i * 120}>
            <Link href={tile.href} className="group relative block">
              <div className="relative aspect-4/5 overflow-hidden rounded-sm bg-muted">
                <Image
                  src={tile.image}
                  alt={tile.label}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-background">
                  <p className="text-[11px] tracking-[0.18em] uppercase opacity-90">
                    {tile.caption}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl tracking-tight">{tile.label}</h3>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
