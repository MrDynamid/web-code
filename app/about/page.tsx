import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, Sparkles, HandHeart, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'The House | Maison Lumière',
  description:
    'The story, values and craft behind Maison Lumière — a Paris-born house of considered ready-to-wear.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">The House</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-balance md:text-5xl">
        Considered clothing, made to last
      </h1>

      <section id="story" className="mt-14 scroll-mt-28">
        <h2 className="font-serif text-2xl tracking-tight">Our story</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Maison Lumière was founded in Paris with a single conviction: that a wardrobe should be
          built slowly, from pieces you return to season after season. We design elevated
          essentials in silk, cashmere and fine wool — quiet, versatile and cut to endure.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Every style begins in our atelier and is produced in small runs by family-owned
          workshops we have partnered with for years. We would rather make less, and make it
          beautifully, than chase the pace of the season.
        </p>
      </section>

      <section id="sustainability" className="mt-14 scroll-mt-28 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Sustainability</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Longevity is our first principle of sustainability — a garment worn for a decade is the
          most responsible one there is.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { icon: Leaf, title: 'Natural fibres', body: 'Certified silk, grade-A cashmere and traceable wool from responsible mills.' },
            { icon: Sparkles, title: 'Small-batch craft', body: 'Produced to order in limited runs to reduce waste and overproduction.' },
            { icon: HandHeart, title: 'Fair partnerships', body: 'Long-term relationships with family-owned workshops paid fairly for their craft.' },
            { icon: Briefcase, title: 'Considered packaging', body: 'Recyclable, tissue-lined boxes with no single-use plastic.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-sm border border-border bg-card p-5">
              <item.icon className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <div className="text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="journal" className="mt-14 scroll-mt-28 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Journal</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Notes on craft, care and how to build a wardrobe that lasts. Our latest edits and
          styling guides live alongside the collection.
        </p>
        <Link
          href="/products?sort=newest"
          className="mt-5 inline-block text-sm font-medium text-gold underline underline-offset-4"
        >
          Explore the new season
        </Link>
      </section>

      <section id="careers" className="mt-14 scroll-mt-28 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Careers</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We are a small, growing team of designers, makers and storytellers. If you care about
          craft and considered design, we would love to hear from you.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block text-sm font-medium text-gold underline underline-offset-4"
        >
          Get in touch
        </Link>
      </section>
    </div>
  )
}
