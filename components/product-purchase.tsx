'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { WishlistButton } from '@/components/wishlist-button'
import { formatPrice, type Product } from '@/lib/product-utils'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'

export function ProductPurchase({
  product,
  wishlisted = false,
}: {
  product: Product
  wishlisted?: boolean
}) {
  const { addItem } = useCart()
  const [color, setColor] = useState(product.colors[0] ?? 'Default')
  const [size, setSize] = useState(product.sizes[0] ?? 'One Size')
  const [quantity, setQuantity] = useState(1)

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price

  function handleAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? '/placeholder.svg',
      color,
      size,
      quantity,
    })
    toast.success('Added to your bag', {
      description: `${product.name} · ${color} · ${size}`,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {product.category}
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-balance md:text-5xl">
          {product.name}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xl font-medium">{formatPrice(product.price)}</span>
          {onSale && (
            <span className="text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            · {Number(product.rating).toFixed(1)} ({product.reviewCount})
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

      {product.colors.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.14em] text-foreground uppercase">
            Color — <span className="text-muted-foreground">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition-colors',
                  c === color
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground/80 hover:border-foreground/40',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.14em] text-foreground uppercase">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  'min-w-12 rounded-sm border px-4 py-2 text-sm transition-colors',
                  s === size
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground/80 hover:border-foreground/40',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-sm border">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button onClick={handleAdd} className="h-12 flex-1 text-sm">
          <ShoppingBag className="size-4" strokeWidth={1.5} />
          Add to bag
        </Button>
        <WishlistButton
          productId={product.id}
          initialWishlisted={wishlisted}
          variant="inline"
        />
      </div>

      <ul className="space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="size-4 text-gold" strokeWidth={2} />
          Complimentary shipping on orders over ₹20,000
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 text-gold" strokeWidth={2} />
          Free 30-day returns
        </li>
        {product.stock <= 15 && (
          <li className="flex items-center gap-2 text-foreground">
            <Check className="size-4 text-gold" strokeWidth={2} />
            Only {product.stock} left in stock
          </li>
        )}
      </ul>
    </div>
  )
}
