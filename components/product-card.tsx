import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatPrice, type Product } from '@/lib/product-utils'
import { WishlistButton } from '@/components/wishlist-button'
import { QuickAddButton } from '@/components/quick-add-button'

export function ProductCard({
  product,
  priority = false,
  wishlisted = false,
}: {
  product: Product
  priority?: boolean
  wishlisted?: boolean
}) {
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price)
  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock <= 10
  // Show quick-add only for products with a single definite variant (no
  // variant selection needed before adding to the bag)
  const showQuickAdd = !outOfStock && product.colors.length === 1 && product.sizes.length <= 1

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-muted">
          <Image
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              'object-cover transition-transform duration-700 ease-out group-hover:scale-105',
              outOfStock && 'opacity-60 grayscale',
            )}
          />
          <WishlistButton productId={product.id} initialWishlisted={wishlisted} />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.badge && (
              <span
                className={cn(
                  'w-fit rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.12em] uppercase',
                  product.badge === 'Bestseller'
                    ? 'bg-gold text-gold-foreground'
                    : 'bg-background/90 text-foreground',
                )}
              >
                {product.badge}
              </span>
            )}
            {onSale && !outOfStock && (
              <span className="w-fit rounded-full bg-primary px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-primary-foreground uppercase">
                Sale
              </span>
            )}
            {outOfStock && (
              <span className="w-fit rounded-full bg-foreground/70 px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-background uppercase">
                Sold out
              </span>
            )}
            {lowStock && (
              <span className="w-fit rounded-full bg-destructive/90 px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-white uppercase">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {product.category}
          </p>
          <h3 className="font-serif text-lg leading-snug tracking-tight transition-colors group-hover:text-gold">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{formatPrice(product.price)}</span>
            {onSale && (
              <span className="text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
      {showQuickAdd && <QuickAddButton product={product} />}
    </div>
  )
}
