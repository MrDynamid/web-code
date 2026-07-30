'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { lineKey, useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/product-utils'

const FREE_SHIPPING_THRESHOLD = 20000

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const { items, itemCount, subtotal, setQuantity, removeItem, hydrated } = useCart()

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="relative inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
        aria-label={`Open cart, ${itemCount} items`}
      >
        <ShoppingBag className="size-5" strokeWidth={1.5} />
        {hydrated && itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-gold-foreground">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-serif text-2xl font-normal tracking-tight">
            Your Bag {itemCount > 0 && <span className="text-muted-foreground">({itemCount})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1} />
            <div className="space-y-1">
              <p className="font-serif text-xl">Your bag is empty</p>
              <p className="text-sm text-muted-foreground">
                Discover pieces made to be worn for years.
              </p>
            </div>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: 'default' }), 'mt-2 h-11 px-8')}
            >
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {subtotal < FREE_SHIPPING_THRESHOLD ? (
                <p className="mt-4 rounded-sm bg-secondary px-3 py-2 text-center text-xs text-secondary-foreground">
                  You&apos;re {formatPrice(remaining)} away from complimentary shipping.
                </p>
              ) : (
                <p className="mt-4 rounded-sm bg-secondary px-3 py-2 text-center text-xs text-secondary-foreground">
                  You&apos;ve unlocked complimentary shipping.
                </p>
              )}
              <ul className="divide-y">
                {items.map((item) => {
                  const key = lineKey(item)
                  return (
                    <li key={key} className="flex gap-4 py-5">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="relative aspect-3/4 w-20 shrink-0 overflow-hidden rounded-sm bg-muted"
                      >
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={() => setOpen(false)}
                              className="font-medium leading-snug hover:text-gold"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.color} · {item.size}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(key)}
                            aria-label={`Remove ${item.name}`}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-sm border">
                            <button
                              onClick={() => setQuantity(key, item.quantity - 1)}
                              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(key, item.quantity + 1)}
                              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <SheetFooter className="gap-3 border-t px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-serif text-xl">{formatPrice(subtotal)}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'default' }), 'h-12 w-full text-sm')}
              >
                Proceed to checkout
              </Link>
              <Button
                variant="ghost"
                className="h-9 w-full"
                onClick={() => setOpen(false)}
              >
                Continue shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
