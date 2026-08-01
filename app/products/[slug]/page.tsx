export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ProductPurchase } from '@/components/product-purchase'
import { ProductGallery } from '@/components/product-gallery'
import { ProductRail } from '@/components/home/product-rail'
import { ProductReviews } from '@/components/product-reviews'
import { RecentlyViewed, RecentlyViewedTracker } from '@/components/recently-viewed'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { getWishlistIds } from '@/app/actions/wishlist'
import { getReviews } from '@/app/actions/reviews'
import { getSession } from '@/lib/admin-auth'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Not found' }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [related, wishlistIds, reviews, session] = await Promise.all([
    getRelatedProducts(product, 4),
    getWishlistIds(),
    getReviews(product.id),
    getSession(),
  ])
  const wishlisted = new Set(wishlistIds)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="transition-colors hover:text-foreground"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ProductGallery images={product.images} name={product.name} badge={product.badge} />
        </div>

        <div className="lg:py-4">
          <ProductPurchase product={product} wishlisted={wishlisted.has(product.id)} />

          <Accordion className="mt-8">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm tracking-[0.08em] uppercase">
                Details
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {product.details ?? product.description}
              </AccordionContent>
            </AccordionItem>
            {product.materials && (
              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm tracking-[0.08em] uppercase">
                  Materials &amp; Care
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {product.materials}. Follow the care label to keep this piece at its best.
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-sm tracking-[0.08em] uppercase">
                Shipping &amp; Returns
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Complimentary shipping on orders over ₹20,000. Enjoy free 30-day returns on all
                unworn pieces with original tags attached.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        reviews={reviews}
        averageRating={Number(product.rating)}
        reviewCount={product.reviewCount}
        isSignedIn={Boolean(session?.user)}
      />

      {related.length > 0 && (
        <div className="mt-8">
          <ProductRail
            eyebrow="You may also like"
            title="Complete the look"
            viewAllHref={`/products?category=${encodeURIComponent(product.category)}`}
            products={related}
            wishlistedIds={wishlistIds}
          />
        </div>
      )}

      <RecentlyViewed excludeId={product.id} />

      <RecentlyViewedTracker productId={product.id} />
    </div>
  )
}
