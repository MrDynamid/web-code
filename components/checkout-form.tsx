"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock, Tag } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/lib/cart"
import { formatINR, shippingFor } from "@/lib/format"
import { validateCoupon } from "@/lib/catalog.actions"
import { placeOrder } from "@/lib/account.actions"
import { createStripeCheckout } from "@/lib/stripe.actions"
import { PaymentMethods, type CardDetails, type PaymentMethod } from "@/components/payment-methods"
import { StripeCheckout } from "@/components/stripe-checkout"
import { SmartImage } from "@/components/smart-image"
import { cn } from "@/lib/utils"

type Address = {
  full_name: string
  phone: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
}

export function CheckoutForm({
  email,
  defaultName,
  address,
  onlinePaymentEnabled,
  publishableKey,
}: {
  email: string
  defaultName: string
  address: Address | null
  onlinePaymentEnabled: boolean
  publishableKey: string
}) {
  const router = useRouter()
  const { items, subtotal, clear } = useCart()

  const [method, setMethod] = useState<PaymentMethod>(onlinePaymentEnabled ? "upi" : "cod")
  const [channel, setChannel] = useState("Google Pay")
  const [card, setCard] = useState<CardDetails>({ number: "", name: "", expiry: "", cvv: "" })

  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponPending, startCoupon] = useTransition()

  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const shipping = shippingFor(subtotal)
  // The discount is only ever a server-computed number; it's re-derived again in
  // placeOrder / createStripeCheckout, so this is display maths only.
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0
  const total = useMemo(() => Math.max(0, subtotal - discount + shipping), [subtotal, discount, shipping])

  function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponError(null)
    startCoupon(async () => {
      const result = await validateCoupon({ code, subtotal })
      if (!result.ok) {
        setCoupon(null)
        setCouponError(result.message)
        return
      }
      setCoupon({ code: result.code, discount: result.discount })
      toast.success(`${result.code} applied`)
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError("Your bag is empty.")
      return
    }

    const form = new FormData(event.currentTarget)
    const shipTo = {
      full_name: String(form.get("full_name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      line1: String(form.get("line1") ?? "").trim(),
      line2: String(form.get("line2") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      pincode: String(form.get("pincode") ?? "").trim(),
      coupon_code: coupon?.code ?? "",
      items: items.map((item) => ({
        slug: item.slug,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    }

    startTransition(async () => {
      try {
        if (method === "cod") {
          const order = await placeOrder({ ...shipTo, payment_method: "cod", payment_channel: "" })
          clear()
          toast.success("Order placed — thank you!")
          router.push(`/orders?highlight=${order.id}`)
          return
        }

        // Every online payment goes through real Stripe Embedded Checkout; the
        // browser only ever receives a client_secret.
        const session = await createStripeCheckout(shipTo)
        setClientSecret(session.client_secret)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't complete that order.")
      }
    })
  }

  if (clientSecret) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl">Complete your payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Paying {formatINR(total)} securely through Stripe. Your bag is held until the payment settles.
        </p>
        <div className="mt-6 rounded-lg border bg-card p-4">
          <StripeCheckout clientSecret={clientSecret} publishableKey={publishableKey} />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-display text-3xl">Your bag is empty</h2>
        <p className="mt-3 text-sm text-muted-foreground">Add a piece you love and it&apos;ll show up here.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
        >
          Browse the collection
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      <div className="space-y-10">
        <section aria-labelledby="ship-heading">
          <h2 id="ship-heading" className="font-display text-2xl">
            Shipping address
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field name="full_name" label="Full name" defaultValue={address?.full_name ?? defaultName} required />
            <Field name="phone" label="Phone" type="tel" defaultValue={address?.phone ?? ""} required minLength={6} />
            <Field name="email" label="Email" type="email" defaultValue={email} required className="sm:col-span-2" />
            <Field
              name="line1"
              label="Address"
              defaultValue={address?.line1 ?? ""}
              required
              minLength={4}
              className="sm:col-span-2"
            />
            <Field
              name="line2"
              label="Apartment, landmark (optional)"
              defaultValue={address?.line2 ?? ""}
              className="sm:col-span-2"
            />
            <Field name="city" label="City" defaultValue={address?.city ?? ""} required minLength={2} />
            <Field name="state" label="State" defaultValue={address?.state ?? ""} required minLength={2} />
            <Field name="pincode" label="PIN code" defaultValue={address?.pincode ?? ""} required minLength={4} />
          </div>
        </section>

        <section aria-labelledby="pay-heading">
          <h2 id="pay-heading" className="font-display text-2xl">
            Payment
          </h2>
          {onlinePaymentEnabled ? (
            <div className="mt-5">
              <PaymentMethods
                method={method}
                onMethodChange={setMethod}
                channel={channel}
                onChannelChange={setChannel}
                card={card}
                onCardChange={setCard}
              />
            </div>
          ) : (
            <div className="mt-5 rounded-lg border bg-card p-5">
              <p className="text-sm font-medium">Cash on delivery</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Card and UPI payments turn on once Stripe is connected. For now, pay the courier when your order
                arrives.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-display text-xl">Order summary</h2>

          <ul className="mt-4 space-y-3 border-b pb-4">
            {items.map((item) => (
              <li key={`${item.slug}-${item.size}-${item.color}`} className="flex gap-3">
                <SmartImage
                  src={item.image || "/images/hero.jpg"}
                  alt={item.name}
                  width={80}
                  height={100}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-16 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatINR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <label htmlFor="coupon" className="text-eyebrow text-muted-foreground">
              Promo code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="MEHR10"
                className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm uppercase outline-none focus-visible:border-primary"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponPending}
                className="flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs tracking-[0.14em] uppercase transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
              >
                <Tag width={13} height={13} strokeWidth={1.6} />
                Apply
              </button>
            </div>
            {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
          </div>

          <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
            <Row term="Subtotal" value={formatINR(subtotal)} />
            {discount > 0 ? <Row term={`Discount (${coupon!.code})`} value={`− ${formatINR(discount)}`} accent /> : null}
            <Row term="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
            <div className="flex items-baseline justify-between border-t pt-3">
              <dt className="font-display text-lg">Total</dt>
              <dd className="font-display text-lg tabular-nums">{formatINR(total)}</dd>
            </div>
          </dl>

          {error ? (
            <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-xs tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? <Loader2 width={15} height={15} className="animate-spin" /> : <Lock width={14} height={14} strokeWidth={1.7} />}
            {method === "cod" ? "Place order" : `Pay ${formatINR(total)}`}
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prices re-verified on our server before any charge.
          </p>
        </div>
      </aside>
    </form>
  )
}

function Row({ term, value, accent }: { term: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className={cn("tabular-nums", accent && "text-primary")}>{value}</dd>
    </div>
  )
}

function Field({
  name,
  label,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  return (
    <label className={cn("text-sm", className)}>
      <span className="text-eyebrow text-muted-foreground">{label}</span>
      <input
        name={name}
        {...rest}
        className="mt-2 h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:border-primary"
      />
    </label>
  )
}
