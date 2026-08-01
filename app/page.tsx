export const dynamic = 'force-dynamic'

import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { ProductRail } from '@/components/home/product-rail'
import { ValueProps } from '@/components/home/value-props'
import { getFeaturedProducts, getNewArrivals } from '@/lib/products'
import { getActiveBanners } from '@/lib/banners'
import { getWishlistIds } from '@/app/actions/wishlist'

export default async function HomePage() {
  const [featured, newArrivals, banners, wishlistIds] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getActiveBanners(),
    getWishlistIds(),
  ])

  return (
    <>
      <Hero banners={banners} />
      <ProductRail
        eyebrow="Most Wanted"
        title="Bestsellers"
        viewAllHref="/products"
        products={featured}
        priority
        wishlistedIds={wishlistIds}
      />
      <CategoryGrid />
      <ProductRail
        eyebrow="Just Arrived"
        title="New Arrivals"
        viewAllHref="/products?sort=newest"
        products={newArrivals}
        wishlistedIds={wishlistIds}
      />
      <ValueProps />
    </>
  )
}
