'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { subscribeNewsletter } from '@/app/actions/newsletter'

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
      { label: 'Shipping & Returns', href: '/shipping-returns' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'The House',
    links: [
      { label: 'Our Story', href: '/about#story' },
      { label: 'Sustainability', href: '/about#sustainability' },
      { label: 'Journal', href: '/about#journal' },
      { label: 'Careers', href: '/about#careers' },
    ],
  },
]

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('email', email)
    startTransition(async () => {
      const res = await subscribeNewsletter(null, fd)
      if (res?.ok) {
        setSubscribed(true)
        toast.success('You\'re on the list!')
      } else if (res?.error) {
        toast.error(res.error)
      }
    })
  }

  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <h2 className="font-serif text-2xl tracking-tight">Maison Lumière</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Considered ready-to-wear crafted from the finest natural fibres. Join our list
              for early access to new collections and private events.
            </p>
            {subscribed ? (
              <p className="mt-5 text-sm font-medium text-gold">
                Thank you — you&apos;re on the list.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5 flex gap-2" aria-label="Newsletter signup">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  aria-label="Email address"
                  className="h-11 rounded-sm bg-background"
                />
                <Button type="submit" disabled={pending} className="h-11 shrink-0 px-6">
                  {pending ? '…' : 'Subscribe'}
                </Button>
              </form>
            )}
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
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/legal#privacy" className="transition-all duration-200 hover:text-foreground">Privacy Policy</Link>
            <Link href="/legal#terms" className="transition-all duration-200 hover:text-foreground">Terms of Service</Link>
            <Link href="/legal#accessibility" className="transition-all duration-200 hover:text-foreground">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
