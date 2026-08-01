'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/db/schema'

const FALLBACK_BANNERS = [
  {
    id: -1,
    eyebrow: 'Up to 70% Off',
    title: 'Deals of the Day',
    subtitle: 'Shop electronics, fashion & home essentials at unbeatable prices.',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80',
    active: true,
    position: 0,
    createdAt: new Date(),
  },
  {
    id: -2,
    eyebrow: 'New Collection',
    title: 'Fresh Fashion Arrivals',
    subtitle: 'Discover the latest styles. New collections added every week.',
    ctaLabel: 'Explore Fashion',
    ctaHref: '/products?category=Fashion',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80',
    active: true,
    position: 1,
    createdAt: new Date(),
  },
  {
    id: -3,
    eyebrow: 'Top Electronics',
    title: 'Gadgets & Tech',
    subtitle: 'Phones, laptops, headphones and smart devices from top brands.',
    ctaLabel: 'Shop Electronics',
    ctaHref: '/products?category=Electronics',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1400&q=80',
    active: true,
    position: 2,
    createdAt: new Date(),
  },
]

export function Hero({ banners }: { banners?: Banner[] | null; banner?: Banner | null }) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK_BANNERS
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return
      setAnimating(true)
      setCurrent(idx)
      setTimeout(() => setAnimating(false), 600)
    },
    [animating],
  )

  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo])
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  const slide = slides[current]
  const fallback = FALLBACK_BANNERS[current % FALLBACK_BANNERS.length]
  const image =
    slide.image && slide.image.startsWith('http') ? slide.image : fallback.image

  return (
    <section
      className="relative overflow-hidden bg-foreground"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
    >
      <div className="relative w-full" style={{ aspectRatio: '16/6', minHeight: '240px', maxHeight: '520px' }}>
        {/* Background */}
        <Image
          src={image}
          alt={slide.title}
          fill
          priority
          sizes="100vw"
          className={cn(
            'object-cover transition-opacity duration-700',
            animating ? 'opacity-60' : 'opacity-100',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
            <div className="max-w-lg">
              {slide.eyebrow && (
                <span className="inline-block rounded-sm bg-yellow-400 px-2.5 py-1 text-[11px] font-bold tracking-widest text-black uppercase">
                  {slide.eyebrow}
                </span>
              )}
              <h1 className="mt-3 font-serif text-2xl font-normal leading-tight text-white text-balance sm:text-4xl md:text-5xl">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-2 text-xs leading-relaxed text-white/80 sm:mt-3 sm:text-sm md:text-base">
                  {slide.subtitle}
                </p>
              )}
              {slide.ctaHref && (
                <Link
                  href={slide.ctaHref}
                  className="mt-4 inline-flex h-10 items-center rounded-sm bg-yellow-400 px-6 text-sm font-bold text-black transition-all hover:bg-yellow-300 sm:mt-5 sm:h-11 sm:px-8"
                >
                  {slide.ctaLabel ?? 'Shop Now'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:p-2.5"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:p-2.5"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
