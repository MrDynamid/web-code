import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, type Product } from '@/lib/db/schema'
import { type SortOption } from '@/lib/product-utils'

export type { Product }
export { CATEGORIES, formatPrice, type SortOption } from '@/lib/product-utils'

export async function getAllProducts(options?: {
  category?: string
  sort?: SortOption
  search?: string
}): Promise<Product[]> {
  const { category, sort = 'featured', search } = options ?? {}

  const orderBy =
    sort === 'price-asc'
      ? [asc(products.price)]
      : sort === 'price-desc'
        ? [desc(products.price)]
        : sort === 'newest'
          ? [desc(products.createdAt)]
          : [desc(products.featured), desc(products.reviewCount)]

  const categoryFilter = category && category !== 'All' ? eq(products.category, category) : undefined
  const searchFilter = search?.trim()
    ? or(ilike(products.name, `%${search.trim()}%`), ilike(products.description, `%${search.trim()}%`), ilike(products.category, `%${search.trim()}%`))
    : undefined
  const where = categoryFilter && searchFilter ? and(categoryFilter, searchFilter) : categoryFilter ?? searchFilter

  return db.select().from(products).where(where).orderBy(...orderBy)
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.reviewCount))
    .limit(limit)
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt)).limit(limit)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  return rows[0] ?? null
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return []
  return db
    .select()
    .from(products)
    .where(sql`${products.id} = ANY(${ids})`)
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(eq(products.category, product.category), ne(products.id, product.id)))
    .limit(limit)
}
