"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/catalog"
import { discountPercent, formatINR } from "@/lib/format"
import { useCart } from "@/lib/cart"
import { pushRecentlyViewed } from "@/lib/recently-viewed"
import { StarRating } from "@/components/star-rating"
import { WishlistButton } from "@/components/wishlist-button"
import { cn } from "@/lib/utils"

/**
 * Variant + quantity selection for one product. Stock is a single number on the
 * product row (not per-variant), so it caps the quantity stepper and gates the
 * add-to-bag button rather than disabling individual sizes.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart()
  const sizes = product.sizes.length > 0 ? product.sizes : ["Free Size"]
  const colors = product.colors.length > 0 ? product.colors : ["As shown"]

  const [size, setSize] = useState(sizes[0]!)
  const [color, setColor] = useState(colors[0]!)
  const [quantity, setQuantity] = useState(1)
  const [touched, setTouched] = useState(false)

  const soldOut = product.stock <= 0
  const lowStock = !soldOut && product.stock <= 5
  const maxQuantity = Math.max(1, Math.min(20, product.stock || 1))
  const off = discountPercent(product.price, product.compare_at_price)

  // A single-size piece needs no explicit choice; multi-size does.
  const needsSize = sizes.length > 1 && !touched

  useEffect(() => {
    pushRecentlyViewed(product.slug)
  }, [product.slug])

  function addToBag() {
    if (soldOut) return
    if (needsSize) {
      toast.error("Please choose a size first")
      return
    }
    add({
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      price: product.price,
      size,
      color,
      quantity,
    })
  }

  return (
    <div>
      <p className="text-eyebrow text-muted-foreground">{product.fabric ?? "Handcrafted"}</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl text-balance">{product.name}</h1>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <StarRating value={Number(product.rating)} size={14} />
        <span>
          {Number(product.rating).toFixed(1)}
          {product.review_count > 0 ? ` · ${product.review_count} reviews` : " · no reviews yet"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-medium">{formatINR(product.price)}</span>
        {product.compare_at_price ? (
          <span className="text-sm text-muted-foreground line-through">{formatINR(product.compare_at_price)}</span>
        ) : null}
        {off ? (
          <span className="rounded-full bg-gradient-gold px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase text-gold-foreground">
            {off}% off
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · Free shipping over ₹2,999</p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

      <div className="mt-8 space-y-6">
        <fieldset>
          <legend className="flex items-baseline justify-between gap-2 text-eyebrow text-muted-foreground">
            <span>Size</span>
            <Link href="/size-guide" className="link-underline text-[11px] tracking-normal normal-case text-primary">
              Size guide
            </Link>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={touched && size === option}
                onClick={() => {
                  setSize(option)
                  setTouched(true)
                }}
                className={cn(
                  "min-w-12 rounded-md border px-3 py-2 text-xs tracking-[0.1em] uppercase transition-colors",
                  touched && size === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-primary hover:text-primary",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        {colors.length > 1 ? (
          <fieldset>
            <legend className="text-eyebrow text-muted-foreground">Colour</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={color === option}
                  onClick={() => setColor(option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                    color === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary hover:text-primary",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              className="p-2.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus width={14} height={14} strokeWidth={1.8} />
            </button>
            <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              disabled={quantity >= maxQuantity}
              className="p-2.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus width={14} height={14} strokeWidth={1.8} />
            </button>
          </div>

          {soldOut ? (
            <p className="text-sm text-muted-foreground">Sold out — join the waitlist below.</p>
          ) : lowStock ? (
            <p className="text-sm text-primary">Only {product.stock} left in stock</p>
          ) : (
            <p className="text-sm text-muted-foreground">In stock · ships in 48 hours</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addToBag}
            disabled={soldOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-xs tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag width={15} height={15} strokeWidth={1.6} />
            {soldOut ? "Sold out" : needsSize ? "Select a size" : "Add to bag"}
          </button>
          <WishlistButton slug={product.slug} label className="rounded-md border px-5 py-3.5" />
        </div>
      </div>
    </div>
  )
}
