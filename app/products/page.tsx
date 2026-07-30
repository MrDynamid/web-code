import type { Metadata } from 'next'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import { getAllProducts } from '@/lib/products'
import { getWishlistIds } from '@/app/actions/wishlist'
import { CATEGORIES, type SortOption } from '@/lib/product-utils'

export const metadata: Metadata = {
  title: 'Shop All | Maison Lumière',
  description:
    'Browse the full Maison Lumière collection of elevated essentials in silk, cashmere and fine wool.',
}

const SORT_OPTIONS: SortOption[] = ['featured', 'newest', 'price-asc', 'price-desc']

function normalizeCategory(value?: string) {
  if (!value || value === 'All') return 'All'
  const match = CATEGORIES.find((c) => c.toLowerCase() === value.toLowerCase())
  return match ?? 'All'
}

function normalizeSort(value?: string): SortOption {
  return SORT_OPTIONS.includes(value as SortOption) ? (value as SortOption) : 'featured'
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const params = await searchParams
  const activeCategory = normalizeCategory(params.category)
  const activeSort = normalizeSort(params.sort)

  const [products, wishlistIds] = await Promise.all([
    getAllProducts({
      category: activeCategory,
      sort: activeSort,
    }),
    getWishlistIds(),
  ])
  const wishlisted = new Set(wishlistIds)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          The collection
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-balance md:text-5xl">
          {activeCategory === 'All' ? 'Shop all' : activeCategory}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Considered pieces designed in Paris and crafted to be worn for years — never
          seasons. Filter by category or sort to find your next essential.
        </p>
      </header>

      <ProductFilters
        activeCategory={activeCategory}
        activeSort={activeSort}
        count={products.length}
      />

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different category — new pieces arrive every week.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={i < 4}
              wishlisted={wishlisted.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
