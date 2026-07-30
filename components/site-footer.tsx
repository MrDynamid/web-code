import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FOOTER_COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'Dresses', href: '/products?category=Dresses' },
      { label: 'Outerwear', href: '/products?category=Outerwear' },
      { label: 'Knitwear', href: '/products?category=Knitwear' },
      { label: 'Accessories', href: '/products?category=Accessories' },
    ],
  },
  {
    title: 'Client Care',
    links: [
      { label: 'Track Your Order', href: '/orders' },
      { label: 'Shipping & Returns', href: '/products' },
      { label: 'Size Guide', href: '/products' },
      { label: 'Contact Us', href: '/products' },
    ],
  },
  {
    title: 'The House',
    links: [
      { label: 'Our Story', href: '/' },
      { label: 'Sustainability', href: '/' },
      { label: 'Journal', href: '/' },
      { label: 'Careers', href: '/' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <h2 className="font-serif text-2xl tracking-tight">Maison Lumière</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Considered ready-to-wear crafted from the finest natural fibres.
              Join our list for early access to new collections and private events.
            </p>
            <form className="mt-5 flex gap-2" aria-label="Newsletter signup">
              <Input
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                className="h-11 rounded-sm bg-background"
              />
              <Button type="submit" className="h-11 shrink-0 px-6">
                Subscribe
              </Button>
            </form>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Maison Lumière. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
