'use client'

import { useEffect, useState } from 'react'
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
import { createOrder, verifyPayment } from '@/app/actions/orders'

const FREE_SHIPPING_THRESHOLD = 20000
const SHIPPING_FEE = 1200
const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = RAZORPAY_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CheckoutForm({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const { items, subtotal, hydrated, clear } = useCart()
  const [placing, setPlacing] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const estimatedTotal = Math.max(0, subtotal + shipping - discountAmount)

  useEffect(() => {
    void loadRazorpay()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (items.length === 0) return
    setPlacing(true)

    const form = e.currentTarget
    const data = new FormData(form)
    const shippingDetails = {
      email: String(data.get('email') || ''),
      fullName: `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim(),
      address: String(data.get('address') || ''),
      city: String(data.get('city') || ''),
      state: String(data.get('state') || ''),
      zip: String(data.get('zip') || ''),
      phone: String(data.get('phone') || ''),
    }
    const couponCode = String(data.get('couponCode') || '').trim()

    const cart = items.map((i) => ({
      id: i.id,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    }))

    try {
      const result = await createOrder(cart, shippingDetails, couponCode)
      if (!result.ok) {
        toast.error(result.error)
        setPlacing(false)
        return
      }

      setDiscountAmount(result.discount)

      // Payment wall: an order is never confirmed without a verified Razorpay payment.
      if (!result.razorpayOrderId || !result.keyId) {
        toast.error('Online payments are temporarily unavailable. Please try again later.')
        setPlacing(false)
        return
      }

      const ok = await loadRazorpay()
      if (!ok || !window.Razorpay) {
        toast.error('Could not load the payment window. Please try again.')
        setPlacing(false)
        return
      }

      const rzp = new window.Razorpay({
        key: result.keyId,
        amount: result.amount * 100,
        currency: result.currency,
        name: 'Maison Lumière',
        description: `Order #${result.orderDbId}`,
        order_id: result.razorpayOrderId,
        prefill: {
          name: result.customer.name,
          email: result.customer.email,
          contact: result.customer.contact,
        },
        theme: { color: '#b89968' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verified = await verifyPayment({
            orderDbId: result.orderDbId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          if (verified.ok) {
            clear()
            router.push(`/orders/confirmation?id=${result.orderDbId}`)
          } else {
            toast.error(verified.error)
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false)
            toast('Payment cancelled', {
              description: 'Your order is saved but not yet paid.',
            })
          },
        },
      })
      rzp.open()
    } catch {
      toast.error('Something went wrong placing your order. Please try again.')
      setPlacing(false)
    }
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={userEmail}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">PIN code</Label>
                <Input id="zip" name="zip" inputMode="numeric" required />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Redeem code</h2>
            <div className="space-y-2">
              <Label htmlFor="couponCode">Promotion code</Label>
              <Input
                id="couponCode"
                name="couponCode"
                placeholder="Enter code like FIRST10"
                autoCapitalize="characters"
              />
              <p className="text-xs text-muted-foreground">
                Use your discount code on checkout. The code is validated server-side before payment.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl tracking-tight">Payment</h2>
            <p className="text-sm text-muted-foreground">
              Secure payment powered by Razorpay. You&apos;ll complete your payment — cards, UPI,
              net banking and wallets — in a secure window after placing your order.
            </p>
          </section>

          <Button type="submit" disabled={placing || !hydrated} className="h-12 text-sm">
            {placing ? 'Processing…' : `Pay ${formatPrice(estimatedTotal)}`}
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
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">-{formatPrice(discountAmount)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-serif text-2xl tabular-nums">{formatPrice(estimatedTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
