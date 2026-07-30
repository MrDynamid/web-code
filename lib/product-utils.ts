// Pure, client-safe helpers and constants. This module MUST NOT import the
// database client (lib/db) so it can be safely used in client components
// without pulling `pg`/`node-postgres` into the browser bundle.
import type { Product } from '@/lib/db/schema'

export type { Product }

export const CATEGORIES = [
  'Dresses',
  'Outerwear',
  'Knitwear',
  'Tops',
  'Bottoms',
  'Accessories',
] as const

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
