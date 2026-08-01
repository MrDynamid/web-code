'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/product-utils'

export function QuickAddButton({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (added) return

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? '/placeholder.svg',
      color: product.colors[0] ?? 'Default',
      size: product.sizes[0] ?? 'One Size',
      quantity: 1,
    })

    setAdded(true)
    toast.success('Added to bag', { description: product.name })
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Quick add ${product.name} to bag`}
      className={cn(
        'absolute inset-x-0 bottom-0 flex h-11 translate-y-full items-center justify-center gap-2',
        'rounded-b-sm border border-t-0 border-border bg-background/95 backdrop-blur-sm',
        'text-sm font-medium transition-all duration-300 ease-out',
        'opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
        'hover:bg-primary hover:text-primary-foreground hover:border-primary',
        added && 'translate-y-0 bg-primary border-primary text-primary-foreground opacity-100',
      )}
    >
      {added ? (
        <><Check className="size-4" strokeWidth={2} />Added</>
      ) : (
        <><ShoppingBag className="size-4" strokeWidth={1.5} />Quick add</>
      )}
    </button>
  )
}
