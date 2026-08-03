import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { getProductDetail } from "@/lib/catalog.queries"
import { getMyReviewVotes } from "@/lib/reviews.actions"
import { getSession } from "@/lib/session"
import { ProductGallery } from "@/components/product-gallery"
import { ProductPurchase } from "@/components/product-purchase"
import { ProductReviews } from "@/components/product-reviews"
import { ProductCard } from "@/components/product-card"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const detail = await getProductDetail(slug)
  if (!detail) return { title: "Product not found" }

  return {
    title: detail.product.name,
    description: detail.product.description?.slice(0, 160),
    openGraph: {
      title: detail.product.name,
      description: detail.product.description?.slice(0, 160) ?? undefined,
      images: detail.product.images.slice(0, 1),
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [detail, votes, session] = await Promise.all([getProductDetail(slug), getMyReviewVotes(), getSession()])

  if (!detail) notFound()
  const { product, reviews, related } = detail

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight width={12} height={12} strokeWidth={1.8} />
        <Link href={`/shop?category=${product.category_slug}`} className="hover:text-foreground">
          {product.category_slug.replace(/-/g, " ")}
        </Link>
        <ChevronRight width={12} height={12} strokeWidth={1.8} />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images.length > 0 ? product.images : ["/images/hero.jpg"]} name={product.name} />

        <div>
          <ProductPurchase product={product} />

          <dl className="mt-8 grid gap-4 border-t pt-6 text-sm sm:grid-cols-3">
            {[
              { icon: Truck, term: "Free shipping", detail: "On orders over ₹2,999" },
              { icon: RotateCcw, term: "7-day returns", detail: "Unworn, tags intact" },
              { icon: ShieldCheck, term: "Handloom mark", detail: "Verified artisan craft" },
            ].map(({ icon: Icon, term, detail: copy }) => (
              <div key={term} className="flex items-start gap-2.5">
                <Icon width={17} height={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <dt className="font-medium">{term}</dt>
                  <dd className="text-xs text-muted-foreground">{copy}</dd>
                </div>
              </div>
            ))}
          </dl>

          {product.care || product.fabric ? (
            <div className="mt-8 space-y-3 border-t pt-6">
              {product.fabric ? (
                <p className="text-sm">
                  <span className="text-eyebrow text-muted-foreground">Fabric</span>{" "}
                  <span className="ml-2 text-muted-foreground">{product.fabric}</span>
                </p>
              ) : null}
              {product.care ? (
                <p className="text-sm">
                  <span className="text-eyebrow text-muted-foreground">Care</span>{" "}
                  <span className="ml-2 text-muted-foreground">{product.care}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-16 lg:mt-24">
        <ProductReviews
          slug={product.slug}
          reviews={reviews}
          votedIds={votes.reviewIds}
          isAuthenticated={Boolean(session?.user)}
          authorName={session?.user?.name ?? ""}
        />
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-16 border-t pt-12 lg:mt-24">
          <h2 id="related-heading" className="font-display text-3xl">
            You may also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
