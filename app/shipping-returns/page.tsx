import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, RefreshCw, Truck, Clock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Shipping & Returns | Maison Lumière',
}

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Client care</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">
        Shipping &amp; Returns
      </h1>

      <section className="mt-14">
        <h2 className="font-serif text-2xl tracking-tight">Shipping</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We ship across India using trusted courier partners. All orders are carefully packaged
          in our signature tissue-lined boxes.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { icon: Truck, label: 'Complimentary shipping', value: 'Orders over ₹20,000', time: '5–7 business days' },
            { icon: Package, label: 'Standard shipping', value: '₹1,200', time: '5–7 business days' },
          ].map((tier) => (
            <div key={tier.label} className="flex items-start gap-4 rounded-sm border border-border bg-card p-5">
              <tier.icon className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <div className="text-sm">
                <p className="font-medium">{tier.label}</p>
                <p className="mt-0.5 text-muted-foreground">{tier.value}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" strokeWidth={1.5} />
                  {tier.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          <li>Orders dispatched within 1–2 business days. A tracking number is emailed on dispatch.</li>
          <li>Metro cities typically receive within 3–5 days; other areas within 5–7 days.</li>
          <li>International shipping is coming soon.</li>
        </ul>
      </section>

      <section className="mt-14 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Returns</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We offer a 30-day return policy from the date of delivery on eligible items.
        </p>
        <div className="mt-6 grid gap-4">
          {[
            {
              icon: CheckCircle2,
              title: 'Eligible for return',
              items: ['Unworn, unwashed, unaltered items', 'Original tags attached', 'Returned within 30 days of delivery'],
            },
            {
              icon: AlertCircle,
              title: 'Not eligible for return',
              items: ['Items showing signs of wear or alteration', 'Final sale items (marked at checkout)', 'Intimate apparel (hygiene)'],
            },
          ].map((section) => (
            <div key={section.title} className="rounded-sm border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <section.icon className="size-5 text-gold" strokeWidth={1.5} />
                <h3 className="font-medium">{section.title}</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">How to return</h2>
        <ol className="mt-6 space-y-5">
          {[
            'Sign in and go to your Orders page.',
            'Email returns@maisonlumiere.com with your order number and reason. Our team will arrange collection within 2 business days.',
            'Once received and inspected, a full refund is issued to your original payment method within 5–7 business days.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {i + 1}
              </span>
              <span className="mt-1 leading-relaxed text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-14 flex gap-6 border-t border-border pt-10">
        <Link href="/orders" className="text-sm font-medium text-gold underline underline-offset-4">
          View my orders
        </Link>
        <Link href="/contact" className="text-sm font-medium underline underline-offset-4 hover:text-gold">
          Contact us
        </Link>
      </div>
    </div>
  )
}
