'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  LogIn,
  Settings,
  ChevronDown,
  Package,
} from 'lucide-react'
import { useState, useRef } from 'react'
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

const CATEGORIES = [
  { label: 'All', href: '/products' },
  { label: 'Electronics', href: '/products?category=Electronics' },
  { label: 'Fashion', href: '/products?category=Fashion' },
  { label: 'Home & Kitchen', href: '/products?category=Home+%26+Kitchen' },
  { label: 'Beauty', href: '/products?category=Beauty' },
  { label: 'Sports', href: '/products?category=Sports' },
  { label: 'Books', href: '/products?category=Books' },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const accountHref = session?.user ? '/account' : '/login'

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-[11px] tracking-widest uppercase">
          Free delivery on orders above ₹200 &nbsp;·&nbsp; Use code{' '}
          <span className="font-bold">WELCOME10</span> for 10% off
        </p>
      </div>

      {/* Main header */}
      <div className="bg-foreground text-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16 md:gap-4 md:px-6">
          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-0 sm:max-w-xs">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="font-serif text-xl font-normal">
                  {session?.user ? `Hello, ${session.user.name?.split(' ')[0] || 'User'}` : 'Hello, Sign in'}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col divide-y">
                <div className="px-2 py-3">
                  <p className="px-4 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Categories
                  </p>
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
                <div className="px-2 py-3">
                  <p className="px-4 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Account
                  </p>
                  <Link href={accountHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-secondary">
                    <User className="size-4" /> {session?.user ? 'My Account' : 'Sign In'}
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-secondary">
                    <Package className="size-4" /> My Orders
                  </Link>
                  <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-secondary">
                    <Heart className="size-4" /> Wishlist
                  </Link>
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-gold transition-colors hover:bg-secondary">
                    <Settings className="size-4" /> Admin Panel
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/"
            className="shrink-0"
            aria-label="ShopEase home"
          >
            <span className="font-serif text-xl font-bold tracking-tight text-background md:text-2xl">
              ShopEase
            </span>
          </Link>

          {/* Search bar (center, prominent) */}
          <form
            onSubmit={handleSearch}
            className="flex flex-1 items-center overflow-hidden rounded-md bg-background"
          >
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands and more..."
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="flex h-9 w-10 shrink-0 items-center justify-center bg-gold text-gold-foreground transition-colors hover:bg-gold/90"
              aria-label="Submit search"
            >
              <Search className="size-4" />
            </button>
          </form>

          {/* Right icons */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={accountHref}
              className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-background transition-colors hover:bg-white/10 md:flex"
            >
              <User className="size-4" />
              <div className="hidden text-left lg:block">
                <p className="text-[10px] text-background/70">Hello,</p>
                <p className="text-xs font-bold leading-none">
                  {session?.user ? session.user.name?.split(' ')[0] || 'User' : 'Sign In'}
                </p>
              </div>
            </Link>
            <Link
              href="/orders"
              className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-background transition-colors hover:bg-white/10 md:flex"
            >
              <Package className="size-4" />
              <div className="hidden text-left lg:block">
                <p className="text-[10px] text-background/70">Returns &</p>
                <p className="text-xs font-bold leading-none">Orders</p>
              </div>
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex size-9 items-center justify-center rounded-md text-background transition-colors hover:bg-white/10"
              aria-label="Wishlist"
            >
              <Heart className="size-5" />
            </Link>
            <Link
              href="/admin"
              className="hidden size-9 items-center justify-center rounded-md text-gold transition-colors hover:bg-white/10 md:inline-flex"
              aria-label="Admin panel"
              title="Admin panel"
            >
              <Settings className="size-5" />
            </Link>
            <CartDrawer />
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="hidden border-b border-border bg-background lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6">
          {CATEGORIES.map((cat) => {
            const active = cat.href === '/products'
              ? pathname === '/products' && !pathname.includes('category')
              : false
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={cn(
                  'shrink-0 py-2.5 text-[13px] font-medium transition-colors hover:text-gold whitespace-nowrap',
                  active ? 'border-b-2 border-gold text-gold' : 'text-foreground/70',
                )}
              >
                {cat.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
