export const dynamic = 'force-dynamic'

import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { ProductRail } from '@/components/home/product-rail'
import { ValueProps } from '@/components/home/value-props'
import { EditorialBanner } from '@/components/home/editorial-banner'
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

  // The first active banner drives the hero; the rest become editorial
  // banners that alternate their layout down the page.
  const [heroBanner, ...editorialBanners] = banners

  return (
    <>
      <Hero banner={heroBanner} />
      <ProductRail
        eyebrow="Most wanted"
        title="Bestsellers"
        viewAllHref="/products"
        products={featured}
        priority
        wishlistedIds={wishlistIds}
      />
      <CategoryGrid />
      <EditorialBanner banner={editorialBanners[0]} />
      <ProductRail
        eyebrow="Just arrived"
        title="New arrivals"
        viewAllHref="/products?sort=newest"
        products={newArrivals}
        wishlistedIds={wishlistIds}
      />
      {editorialBanners[1] && <EditorialBanner banner={editorialBanners[1]} reverse />}
      <ValueProps />
    </>
  )
}
