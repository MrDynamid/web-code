export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/admin-auth'
import { getWishlistProducts } from '@/app/actions/wishlist'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/product-utils'

export const metadata = {
  title: 'Wishlist | Maison Lumière',
}

export default async function WishlistPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login?redirect=/wishlist')

  const wishlist = await getWishlistProducts()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">My account</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <Heart className="size-10 text-gold" strokeWidth={1.4} />
          <h2 className="font-serif text-2xl">No saved pieces yet</h2>
          <p className="text-sm text-muted-foreground">
            Save your favourite dresses, coats and accessories from the collection.
          </p>
          <Button asChild>
            <Link href="/products">Shop the collection</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((product) => (
            <article key={product.id} className="rounded-sm border border-border bg-card p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted">
                <Image
                  src={product.images[0] || '/placeholder.svg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${product.slug}`} className="font-medium hover:text-gold">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatPrice(product.price)}</span>
              </div>
              <Link href={`/products/${product.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm text-gold">
                View item <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
