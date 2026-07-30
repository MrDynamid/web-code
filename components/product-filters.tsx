'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, type SortOption } from '@/lib/product-utils'
import { cn } from '@/lib/utils'

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
}

export function ProductFilters({
  activeCategory,
  activeSort,
  count,
}: {
  activeCategory: string
  activeSort: SortOption
  count: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) params.delete(key)
      else params.set(key, value)
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const categories = ['All', ...CATEGORIES]

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {categories.map((category) => {
          const active = category === activeCategory
          return (
            <button
              key={category}
              onClick={() => setParam('category', category === 'All' ? null : category)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground/80 hover:border-foreground/40',
              )}
            >
              {category}
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'piece' : 'pieces'}
        </p>
        <Select value={activeSort} onValueChange={(value) => setParam('sort', value)}>
          <SelectTrigger className="h-9 w-48 rounded-sm border-border bg-background text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
