'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/db/schema'
import { getRecentlyViewedProducts } from '@/app/actions/recently-viewed'
import { ProductRail } from '@/components/home/product-rail'

const KEY = 'ml_recently_viewed'
const MAX = 12

function readIds(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

/**
 * Records the current product id at the front of the per-device recently-viewed
 * list. Renders nothing.
 */
export function RecentlyViewedTracker({ productId }: { productId: number }) {
  useEffect(() => {
    const ids = readIds().filter((id) => id !== productId)
    ids.unshift(productId)
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)))
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [productId])

  return null
}

/**
 * Displays a rail of recently-viewed products (device-local), optionally
 * excluding the current product. Hydrates ids into product records on mount.
 */
export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const ids = readIds().filter((id) => id !== excludeId)
    if (ids.length === 0) return
    let active = true
    getRecentlyViewedProducts(ids).then((rows) => {
      if (active) setProducts(rows)
    })
    return () => {
      active = false
    }
  }, [excludeId])

  if (products.length === 0) return null

  return (
    <ProductRail
      eyebrow="Recently viewed"
      title="Pick up where you left off"
      viewAllHref="/products"
      products={products}
    />
  )
}
