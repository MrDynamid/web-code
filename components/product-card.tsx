import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, type Product } from '@/lib/product-utils'
import { cn } from '@/lib/utils'

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-3/4 overflow-hidden rounded-sm bg-muted">
        <Image
          src={product.images[0] || '/placeholder.svg'}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {product.badge && (
          <span
            className={cn(
              'absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.12em] uppercase',
              product.badge === 'Bestseller'
                ? 'bg-gold text-gold-foreground'
                : 'bg-background/90 text-foreground',
            )}
          >
            {product.badge}
          </span>
        )}
        {onSale && (
          <span className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-primary-foreground uppercase">
            Sale
          </span>
        )}
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
  )
}
