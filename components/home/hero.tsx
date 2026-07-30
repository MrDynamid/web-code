import Image from 'next/image'
import Link from 'next/link'
import type { Banner } from '@/lib/db/schema'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FALLBACK = {
  eyebrow: 'The Autumn Collection',
  title: 'Quiet luxury, made to last',
  subtitle:
    'Elevated essentials in silk, cashmere and fine wool — designed in Paris and crafted to be worn for years, not seasons.',
  ctaLabel: 'Shop the collection',
  ctaHref: '/products',
  image: '/editorial/hero.png',
}

export function Hero({ banner }: { banner?: Banner | null }) {
  const eyebrow = banner?.eyebrow ?? FALLBACK.eyebrow
  const title = banner?.title ?? FALLBACK.title
  const subtitle = banner?.subtitle ?? FALLBACK.subtitle
  const ctaLabel = banner?.ctaLabel ?? FALLBACK.ctaLabel
  const ctaHref = banner?.ctaHref ?? FALLBACK.ctaHref
  const image = banner?.image ?? FALLBACK.image

  return (
    <section className="relative">
      <div className="relative h-[80vh] min-h-[560px] w-full overflow-hidden">
        <Image
          src={image || '/placeholder.svg'}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex w-full max-w-7xl px-4 md:px-6">
            <div className="max-w-xl text-background">
              <p className="animate-fade-slide text-xs tracking-[0.3em] uppercase">
                {eyebrow}
              </p>
              <h1
                className="animate-fade-slide mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-balance md:text-7xl"
                style={{ animationDelay: '120ms' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="animate-fade-slide mt-5 max-w-md text-sm leading-relaxed text-background/90 md:text-base"
                  style={{ animationDelay: '240ms' }}
                >
                  {subtitle}
                </p>
              )}
              <div
                className="animate-fade-slide mt-8 flex flex-wrap gap-3"
                style={{ animationDelay: '360ms' }}
              >
                {ctaLabel && (
                  <Link
                    href={ctaHref || '/products'}
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'h-12 bg-background px-8 text-sm text-foreground hover:bg-background/90',
                    )}
                  >
                    {ctaLabel}
                  </Link>
                )}
                <Link
                  href="/products?category=Outerwear"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-12 border-background/60 bg-transparent px-8 text-sm text-background hover:bg-background/10 hover:text-background',
                  )}
                >
                  Explore outerwear
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
