import Image from 'next/image'
import Link from 'next/link'
import type { Banner } from '@/lib/db/schema'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FALLBACK = {
  eyebrow: 'Deals of the Day',
  title: 'Top Brands, Best Prices',
  subtitle:
    'Millions of products across electronics, fashion, home and more. Fast delivery, easy returns.',
  ctaLabel: 'Shop Now',
  ctaHref: '/products',
  image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80',
}

export function Hero({ banner }: { banner?: Banner | null }) {
  const eyebrow = banner?.eyebrow ?? FALLBACK.eyebrow
  const title = banner?.title ?? FALLBACK.title
  const subtitle = banner?.subtitle ?? FALLBACK.subtitle
  const ctaLabel = banner?.ctaLabel ?? FALLBACK.ctaLabel
  const ctaHref = banner?.ctaHref ?? FALLBACK.ctaHref
  const image = (banner?.image && banner.image.startsWith('http')) ? banner.image : FALLBACK.image

  return (
    <section className="relative">
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden sm:h-[70vh] sm:min-h-[500px]">
        <Image
          src={image}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex w-full max-w-7xl px-4 md:px-6">
            <div className="max-w-xl text-white">
              <p className="animate-fade-slide rounded-sm bg-yellow-400 px-2 py-0.5 text-[11px] font-semibold tracking-widest text-black uppercase w-fit">
                {eyebrow}
              </p>
              <h1
                className="animate-fade-slide mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-balance md:text-6xl"
                style={{ animationDelay: '120ms' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="animate-fade-slide mt-4 max-w-md text-sm leading-relaxed text-white/85 md:text-base"
                  style={{ animationDelay: '240ms' }}
                >
                  {subtitle}
                </p>
              )}
              <div
                className="animate-fade-slide mt-6 flex flex-wrap gap-3"
                style={{ animationDelay: '360ms' }}
              >
                {ctaLabel && (
                  <Link
                    href={ctaHref || '/products'}
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'h-11 bg-yellow-400 px-8 text-sm font-bold text-black hover:bg-yellow-300',
                    )}
                  >
                    {ctaLabel}
                  </Link>
                )}
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-11 border-white/60 bg-transparent px-8 text-sm text-white hover:bg-white/10 hover:text-white',
                  )}
                >
                  Browse all deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
