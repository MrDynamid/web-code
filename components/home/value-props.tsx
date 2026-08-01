import { Package, RefreshCw, Shield, Headphones } from 'lucide-react'

const PROPS = [
  {
    icon: Package,
    title: 'Free Delivery',
    body: 'On orders above ₹200. Delivered in 2–5 business days.',
  },
  {
    icon: RefreshCw,
    title: '10-Day Returns',
    body: 'Easy hassle-free returns within 10 days of delivery.',
  },
  {
    icon: Shield,
    title: '100% Secure',
    body: 'All payments are encrypted and fully secure.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    body: 'Round-the-clock customer support, always here for you.',
  },
]

export function ValueProps() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-border px-4 md:px-6 md:divide-x md:divide-y-0 sm:grid-cols-2 lg:grid-cols-4">
        {PROPS.map((item) => (
          <div key={item.title} className="flex items-start gap-4 px-4 py-6 first:pl-0 last:pr-0 md:px-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
              <item.icon className="size-5 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
