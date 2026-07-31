'use server'

import { getProductsByIds } from '@/lib/products'
import type { Product } from '@/lib/db/schema'

/**
 * Hydrates recently-viewed product ids (stored per-device in localStorage) into
 * full product records, preserving the client-provided order.
 */
export async function getRecentlyViewedProducts(ids: number[]): Promise<Product[]> {
  const clean = ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, 12)
  if (clean.length === 0) return []
  const rows = await getProductsByIds(clean)
  const byId = new Map(rows.map((r) => [r.id, r]))
  return clean.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
}
