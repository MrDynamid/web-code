import { and, asc, desc, eq, ne, sql, type SQL } from "drizzle-orm"
import { db } from "@/db"
import { banners, categories, products, reviews } from "@/db/schema"
import { PRICE_BANDS, type SortValue } from "@/lib/catalog"

/**
 * Server-only read helpers. These are called directly from Server Components
 * (no HTTP hop, no client bundle), which replaces the TanStack
 * createServerFn + react-query round trip the Vite version needed.
 */

export async function getStorefront() {
  const [productRows, categoryRows, bannerRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.created_at)),
    db.select().from(categories).orderBy(asc(categories.position)),
    db.select().from(banners).where(eq(banners.active, true)).orderBy(asc(banners.position)),
  ])

  return { products: productRows, categories: categoryRows, banners: bannerRows }
}

/** Lightweight nav/search payload for the shared header and footer. */
export async function getNavData() {
  const [categoryRows, productRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.position)),
    db
      .select({
        slug: products.slug,
        name: products.name,
        price: products.price,
        images: products.images,
        fabric: products.fabric,
        category_slug: products.category_slug,
      })
      .from(products)
      .orderBy(asc(products.name)),
  ])
  return { categories: categoryRows, products: productRows }
}

export type NavProduct = Awaited<ReturnType<typeof getNavData>>["products"][number]

export type ShopFilters = {
  q?: string
  category?: string
  price?: string
  size?: string
  color?: string
  sort?: SortValue
  inStock?: boolean
  onSale?: boolean
}

const SORT_CLAUSES: Record<SortValue, SQL[]> = {
  featured: [desc(products.featured), desc(products.rating)],
  new: [desc(products.created_at)],
  "price-asc": [asc(products.price)],
  "price-desc": [desc(products.price)],
  rating: [desc(products.rating), desc(products.review_count)],
}

/**
 * The whole shop grid is filtered, sorted and counted in Postgres so a large
 * catalogue never has to be shipped to the browser to be narrowed down.
 */
export async function getShopProducts(filters: ShopFilters) {
  const conditions: SQL[] = []

  if (filters.q) {
    // Match across the fields a shopper would actually type.
    const pattern = `%${filters.q.trim()}%`
    conditions.push(
      sql`(${products.name} ILIKE ${pattern}
        OR ${products.description} ILIKE ${pattern}
        OR COALESCE(${products.fabric}, '') ILIKE ${pattern}
        OR ${products.category_slug} ILIKE ${pattern})`,
    )
  }

  if (filters.category) conditions.push(eq(products.category_slug, filters.category))

  const band = PRICE_BANDS.find((option) => option.value === filters.price)
  if (band) conditions.push(sql`${products.price} BETWEEN ${band.min} AND ${band.max}`)

  // sizes/colors are text[] columns, so membership is a single array containment.
  if (filters.size) conditions.push(sql`${products.sizes} @> ARRAY[${filters.size}]::text[]`)
  if (filters.color) conditions.push(sql`${products.colors} @> ARRAY[${filters.color}]::text[]`)

  if (filters.inStock) conditions.push(sql`${products.stock} > 0`)
  if (filters.onSale) conditions.push(sql`${products.compare_at_price} > ${products.price}`)

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = SORT_CLAUSES[filters.sort ?? "featured"] ?? SORT_CLAUSES.featured

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderBy, asc(products.id))

  return rows
}

/** Facet values (sizes, colours, price span) derived from the live catalogue. */
export async function getShopFacets() {
  const [row] = await db
    .select({
      sizes: sql<string[] | null>`(SELECT ARRAY_AGG(DISTINCT s ORDER BY s) FROM ${products}, UNNEST(${products.sizes}) AS s)`,
      colors: sql<
        string[] | null
      >`(SELECT ARRAY_AGG(DISTINCT c ORDER BY c) FROM ${products}, UNNEST(${products.colors}) AS c)`,
      minPrice: sql<number>`COALESCE(MIN(${products.price}), 0)`,
      maxPrice: sql<number>`COALESCE(MAX(${products.price}), 0)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(products)

  return {
    sizes: row?.sizes ?? [],
    colors: row?.colors ?? [],
    minPrice: Number(row?.minPrice ?? 0),
    maxPrice: Number(row?.maxPrice ?? 0),
    total: Number(row?.total ?? 0),
  }
}

export async function getProductDetail(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  if (!product) return null

  const [reviewRows, relatedRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.product_slug, slug), eq(reviews.approved, true)))
      .orderBy(desc(reviews.helpful_count), desc(reviews.created_at)),
    db
      .select()
      .from(products)
      .where(and(eq(products.category_slug, product.category_slug), ne(products.slug, slug)))
      .limit(4),
  ])

  // Review photos are public Vercel Blob URLs, so they render directly.
  return { product, reviews: reviewRows, related: relatedRows }
}

export async function getAllProductSlugs() {
  return db.select({ slug: products.slug, created_at: products.created_at }).from(products)
}

export type StorefrontData = Awaited<ReturnType<typeof getStorefront>>
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>
export type Product = StorefrontData["products"][number]
export type Category = StorefrontData["categories"][number]
export type Banner = StorefrontData["banners"][number]
export type Review = ProductDetail["reviews"][number]
