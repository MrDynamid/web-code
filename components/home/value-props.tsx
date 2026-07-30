import { Leaf, Package, RefreshCw, Sparkles } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'

const PROPS = [
  {
    icon: Sparkles,
    title: 'Considered craft',
    body: 'Each piece is made in small runs by specialist ateliers.',
  },
  {
    icon: Leaf,
    title: 'Natural fibres',
    body: 'Silk, cashmere and wool sourced from certified mills.',
  },
  {
    icon: Package,
    title: 'Complimentary shipping',
    body: 'On all orders over ₹15,000, delivered with care.',
  },
  {
    icon: RefreshCw,
    title: 'Easy 30-day returns',
    body: 'Changed your mind? Return within 30 days, on us.',
  },
]

export function ValueProps() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        {PROPS.map((item, i) => (
          <ScrollReveal
            key={item.title}
            direction="up"
            delay={i * 100}
            className="flex flex-col items-start gap-3"
          >
            <item.icon className="size-6 text-gold" strokeWidth={1.5} />
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
