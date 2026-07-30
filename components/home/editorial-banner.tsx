import Image from 'next/image'
import Link from 'next/link'
import type { Banner } from '@/lib/db/schema'
import { buttonVariants } from '@/components/ui/button'
import { ScrollReveal } from '@/components/scroll-reveal'
import { cn } from '@/lib/utils'

const FALLBACK = {
  eyebrow: 'The cashmere edit',
  title: 'The softest layers for the season ahead',
  subtitle:
    'Our Grade-A Mongolian cashmere is spun for exceptional softness and longevity. Timeless knits designed to become the pieces you reach for again and again.',
  ctaLabel: 'Shop knitwear',
  ctaHref: '/products?category=Knitwear',
  image: '/editorial/category-knitwear.png',
}

export function EditorialBanner({
  banner,
  reverse = false,
}: {
  banner?: Banner | null
  reverse?: boolean
}) {
  const eyebrow = banner?.eyebrow ?? FALLBACK.eyebrow
  const title = banner?.title ?? FALLBACK.title
  const subtitle = banner?.subtitle ?? FALLBACK.subtitle
  const ctaLabel = banner?.ctaLabel ?? FALLBACK.ctaLabel
  const ctaHref = banner?.ctaHref ?? FALLBACK.ctaHref
  const image = banner?.image ?? FALLBACK.image

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="grid items-stretch gap-0 overflow-hidden rounded-sm border border-border md:grid-cols-2">
        <ScrollReveal
          direction={reverse ? 'right' : 'left'}
          className={cn('relative min-h-80 bg-muted', reverse && 'md:order-2')}
        >
          <Image
            src={image || '/placeholder.svg'}
            alt={title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105"
          />
        </ScrollReveal>
        <ScrollReveal
          direction={reverse ? 'left' : 'right'}
          delay={120}
          className={cn(
            'flex flex-col justify-center gap-5 bg-card px-8 py-14 md:px-14',
            reverse && 'md:order-1',
          )}
        >
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance md:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
          {ctaLabel && (
            <div>
              <Link
                href={ctaHref || '/products'}
                className={cn(buttonVariants({ variant: 'default' }), 'h-12 px-8 text-sm')}
              >
                {ctaLabel}
              </Link>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
