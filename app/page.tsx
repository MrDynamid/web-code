import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { ProductRail } from '@/components/home/product-rail'
import { ValueProps } from '@/components/home/value-props'
import { EditorialBanner } from '@/components/home/editorial-banner'
import { getFeaturedProducts, getNewArrivals } from '@/lib/products'
import { getActiveBanners } from '@/lib/banners'

export default async function HomePage() {
  const [featured, newArrivals, banners] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getActiveBanners(),
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
      />
      <CategoryGrid />
      <EditorialBanner banner={editorialBanners[0]} />
      <ProductRail
        eyebrow="Just arrived"
        title="New arrivals"
        viewAllHref="/products?sort=newest"
        products={newArrivals}
      />
      {editorialBanners[1] && <EditorialBanner banner={editorialBanners[1]} reverse />}
      <ValueProps />
    </>
  )
}
