'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[]
  name: string
  badge?: string | null
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultiple = images.length > 1

  if (!hasMultiple) {
    return (
      <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-muted">
        <Image
          src={images[0] || '/placeholder.svg'}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {badge && (
          <span className="absolute top-4 left-4 rounded-full bg-gold px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-gold-foreground uppercase">
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-muted">
        <Image
          src={images[activeIndex] || '/placeholder.svg'}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-opacity duration-300"
        />
        {badge && (
          <span className="absolute top-4 left-4 rounded-full bg-gold px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-gold-foreground uppercase">
            {badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'relative aspect-3/4 overflow-hidden rounded-sm border-2 transition-colors',
              i === activeIndex
                ? 'border-primary'
                : 'border-transparent hover:border-foreground/30',
            )}
            aria-label={`View image ${i + 1}`}
            aria-current={i === activeIndex}
          >
            <Image
              src={img}
              alt={`${name} — view ${i + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
