import type { Metadata } from "next"
import Link from "next/link"
import { getShopFacets, getShopProducts, getNavData } from "@/lib/catalog.queries"
import { SORT_OPTIONS, type SortValue } from "@/lib/catalog"
import { ProductCard } from "@/components/product-card"
import { ShopControls } from "@/components/shop-controls"

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse handwoven sarees, lehengas, kurta sets and everyday edits. Filter by size, colour and price.",
}

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value))

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value) || undefined
  }

  const sortParam = one("sort")
  const filters = {
    q: one("q"),
    category: one("category"),
    price: one("price"),
    size: one("size"),
    color: one("color"),
    sort: (sortParam && SORT_VALUES.has(sortParam) ? sortParam : "featured") as SortValue,
    inStock: one("inStock") === "1",
    onSale: one("onSale") === "1",
  }

  const [products, facets, nav] = await Promise.all([getShopProducts(filters), getShopFacets(), getNavData()])

  const activeCategory = nav.categories.find((category) => category.slug === filters.category)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="max-w-2xl">
        <p className="text-eyebrow text-muted-foreground">{activeCategory ? "Category" : "Collection"}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-balance">
          {activeCategory ? activeCategory.name : filters.q ? `Results for “${filters.q}”` : "Shop all"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {activeCategory?.tagline ??
            "Every piece is woven, dyed and finished by hand. Sizes run true — check the size guide if you're between two."}
        </p>
      </header>

      <div className="mt-8 border-y py-5">
        <ShopControls facets={facets} categories={nav.categories} resultCount={products.length} />
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="font-display text-2xl">Nothing matches those filters</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Try widening your price range or clearing a filter — the full collection is only a click away.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
          >
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  )
}
