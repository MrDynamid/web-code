'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Menu, Search, User, LogIn } from 'lucide-react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CartDrawer } from '@/components/cart-drawer'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

const NAV_LINKS = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Dresses', href: '/products?category=Dresses' },
  { label: 'Outerwear', href: '/products?category=Outerwear' },
  { label: 'Knitwear', href: '/products?category=Knitwear' },
  { label: 'Accessories', href: '/products?category=Accessories' },
  { label: 'Shop All', href: '/products' },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const accountHref = session?.user ? '/account' : '/login'

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="bg-primary text-primary-foreground">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs tracking-[0.15em] uppercase">
          Complimentary shipping on orders over ₹20,000
        </p>
      </div>

      <div className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
          {/* Left: mobile menu + desktop nav */}
          <div className="flex flex-1 items-center gap-1">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" strokeWidth={1.5} />
              </SheetTrigger>
              <SheetContent side="left" className="w-full p-0 sm:max-w-sm">
                <SheetHeader className="border-b px-6 py-5">
                  <SheetTitle className="font-serif text-2xl font-normal">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-2 py-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-sm px-4 py-3 font-serif text-xl transition-colors hover:bg-secondary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-2 flex flex-col gap-1 border-t px-2 py-4 text-sm">
                  <Link href={accountHref} onClick={() => setMenuOpen(false)} className="rounded-sm px-4 py-2.5 transition-colors hover:bg-secondary">
                    {session?.user ? 'My account' : 'Sign in'}
                  </Link>
                  <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-sm px-4 py-2.5 transition-colors hover:bg-secondary">
                    Wishlist
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="rounded-sm px-4 py-2.5 transition-colors hover:bg-secondary">
                    My orders
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_LINKS.slice(0, 5).map((link) => {
                const active = pathname.startsWith('/products') && link.href.includes('category')
                  ? pathname === '/products' && link.href === '/products'
                  : false
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-[13px] tracking-wide text-foreground/80 transition-colors hover:text-gold',
                      active && 'text-gold',
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Center: logo */}
          <Link
            href="/"
            className="flex shrink-0 flex-col items-center leading-none"
            aria-label="Maison Lumière home"
          >
            <span className="font-serif text-2xl tracking-tight md:text-[26px]">
              Maison Lumière
            </span>
            <span className="mt-0.5 text-[9px] tracking-[0.35em] text-muted-foreground uppercase">
              Paris
            </span>
          </Link>

          {/* Right: icons */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <form action="/products" className="hidden items-center sm:flex">
              <label className="sr-only" htmlFor="site-search">Search products</label>
              <input id="site-search" name="q" placeholder="Search" className="w-0 border-0 bg-transparent text-sm opacity-0 outline-none transition-all focus:w-36 focus:opacity-100" />
              <button type="submit" className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Search products">
                <Search className="size-5" strokeWidth={1.5} />
              </button>
            </form>
            <Link
              href={accountHref}
              className="hidden size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary sm:inline-flex"
              aria-label={session?.user ? 'My account' : 'Sign in'}
            >
              {session?.user ? (
                <User className="size-5" strokeWidth={1.5} />
              ) : (
                <LogIn className="size-5" strokeWidth={1.5} />
              )}
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              aria-label="Wishlist"
            >
              <Heart className="size-5" strokeWidth={1.5} />
            </Link>
            <CartDrawer />
          </div>
        </div>
      </div>
    </header>
  )
}
