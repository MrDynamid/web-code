'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { lineKey, useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/product-utils'

const FREE_SHIPPING_THRESHOLD = 20000
const SHIPPING_FEE = 1200

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, hydrated, clear } = useCart()
  const [placing, setPlacing] = useState(false)

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPlacing(true)
    setTimeout(() => {
      clear()
      toast.success('Order placed', {
        description: 'Thank you — a confirmation is on its way to your inbox.',
      })
      router.push('/')
      setPlacing(false)
    }, 900)
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center">
        <h1 className="font-serif text-3xl tracking-tight">Your bag is empty</h1>
        <p className="text-sm text-muted-foreground">
          Add a few pieces before heading to checkout.
        </p>
        <Link href="/products">
          <Button className="mt-2 h-11 px-8">Shop the collection</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Checkout</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Contact</h2>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" required />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Payment</h2>
            <div className="space-y-2">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" inputMode="numeric" placeholder="1234 5678 9012 3456" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" placeholder="MM/YY" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" inputMode="numeric" placeholder="123" required />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is a demo store — no payment is processed and no card is charged.
            </p>
          </section>

          <Button type="submit" disabled={placing} className="h-12 text-sm">
            {placing ? 'Placing order…' : `Pay ${formatPrice(total)}`}
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-serif text-2xl tracking-tight">Order summary</h2>
            <ul className="mt-6 divide-y">
              {items.map((item) => (
                <li key={lineKey(item)} className="flex gap-4 py-4">
                  <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                    <Image
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col text-sm">
                    <span className="font-medium leading-snug">{item.name}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {item.color} · {item.size} · Qty {item.quantity}
                    </span>
                    <span className="mt-auto font-medium tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
                </dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-serif text-2xl tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
