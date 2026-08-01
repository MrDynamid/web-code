'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
<<<<<<< HEAD
import { Banknote, CreditCard, Tag, Truck } from 'lucide-react'
=======
import { Banknote, CreditCard } from 'lucide-react'
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { lineKey, useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/product-utils'
<<<<<<< HEAD
import { createOrder, verifyPayment, previewCoupon } from '@/app/actions/orders'
=======
import { createOrder, verifyPayment } from '@/app/actions/orders'
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
import { cn } from '@/lib/utils'

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

type PaymentMethod = 'cod' | 'razorpay'

export function CheckoutForm({
  userEmail,
  razorpayReady,
}: {
  userEmail: string
  razorpayReady: boolean
}) {
  const router = useRouter()
  const { items, subtotal, hydrated, clear } = useCart()
  const [placing, setPlacing] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
<<<<<<< HEAD
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponPending, setCouponPending] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
=======
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    razorpayReady ? 'razorpay' : 'cod',
  )

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const estimatedTotal = Math.max(0, subtotal + shipping - discountAmount)
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

  useEffect(() => {
    void loadRazorpay()
  }, [])

  // Re-validate the applied coupon whenever the subtotal changes so the preview
  // never drifts from what the server will actually charge.
  useEffect(() => {
    if (!appliedCoupon) return
    let cancelled = false
    previewCoupon(appliedCoupon, subtotal).then((res) => {
      if (cancelled) return
      if (res.ok) {
        setDiscountAmount(res.discount)
      } else {
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setCouponError(res.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [subtotal, appliedCoupon])

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponPending(true)
    setCouponError(null)
    const res = await previewCoupon(code, subtotal)
    if (res.ok) {
      setAppliedCoupon(res.code)
      setDiscountAmount(res.discount)
      toast.success(`Code ${res.code} applied — you saved ${formatPrice(res.discount)}.`)
    } else {
      setAppliedCoupon(null)
      setDiscountAmount(0)
      setCouponError(res.error)
    }
    setCouponPending(false)
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponInput('')
    setCouponError(null)
  }

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
      const result = await createOrder(cart, shippingDetails, couponCode, paymentMethod)
      if (!result.ok) {
        toast.error(result.error)
        setPlacing(false)
        return
      }

      setDiscountAmount(result.discount)

      // Cash on Delivery — order is confirmed immediately, no payment gateway.
      if (result.paymentMethod === 'cod') {
        clear()
        router.push(`/orders/confirmation?id=${result.orderDbId}`)
        return
      }

      // Razorpay — open the payment window.
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
            <input type="hidden" name="couponCode" value={appliedCoupon ?? ''} />
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-sm border border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="size-4 text-gold" strokeWidth={1.5} />
                  <span className="font-medium">{appliedCoupon}</span>
                  <span className="text-muted-foreground">
                    applied · −{formatPrice(discountAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="couponInput">Promotion code</Label>
                <div className="flex gap-2">
                  <Input
                    id="couponInput"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        void handleApplyCoupon()
                      }
                    }}
                    placeholder="Try FIRST10 or SAVE500"
                    autoCapitalize="characters"
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponPending || !couponInput.trim()}
                    className="h-11 shrink-0 px-6"
                  >
                    {couponPending ? '…' : 'Apply'}
                  </Button>
                </div>
                {couponError ? (
                  <p role="alert" className="text-xs text-destructive">
                    {couponError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter a code to preview your savings. It&apos;s re-validated server-side before payment.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl tracking-tight">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  'flex items-start gap-3 rounded-sm border p-4 text-left transition-colors',
                  paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                <Banknote className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pay in cash when your order arrives.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                disabled={!razorpayReady}
                className={cn(
                  'flex items-start gap-3 rounded-sm border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  paymentMethod === 'razorpay' && razorpayReady
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                <CreditCard className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium">
                    Online payment {razorpayReady ? '' : '(unavailable)'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Cards, UPI, net banking & wallets via Razorpay.
                  </p>
                </div>
              </button>
            </div>
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
          </section>

          <Button type="submit" disabled={placing || !hydrated} className="h-12 text-sm">
            {placing
              ? 'Processing…'
              : paymentMethod === 'cod'
                ? `Place order · ${formatPrice(estimatedTotal)}`
                : `Pay ${formatPrice(estimatedTotal)}`}
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-serif text-2xl tracking-tight">Order summary</h2>

            {subtotal > 0 && (
              <div className="mt-5 rounded-sm bg-secondary/50 p-4">
                <p className="flex items-center gap-2 text-xs">
                  <Truck className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                  {remainingForFreeShipping === 0 ? (
                    <span className="font-medium text-foreground">
                      You&apos;ve unlocked complimentary shipping.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Add{' '}
                      <span className="font-medium text-foreground">
                        {formatPrice(remainingForFreeShipping)}
                      </span>{' '}
                      more for complimentary shipping.
                    </span>
                  )}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

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
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-gold">
                  <dt>Discount{appliedCoupon ? ` (${appliedCoupon})` : ''}</dt>
                  <dd className="tabular-nums">−{formatPrice(discountAmount)}</dd>
                </div>
              )}
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
