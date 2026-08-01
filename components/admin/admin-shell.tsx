'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  Tags,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Banners', href: '/admin/banners', icon: Images },
  { label: 'Coupons', href: '/admin/coupons', icon: Tags },
]

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string }
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/admin/sign-in')
    router.refresh()
  }

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30 lg:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-border bg-card transition-all duration-300 lg:h-svh lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-6 py-6">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-serif text-xl tracking-tight">Maison Lumière</span>
            <span className="mt-1 text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden flex-col gap-3 border-t border-border p-4 transition-all duration-300 lg:flex">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:gap-3"
          >
            <Store className="size-4" strokeWidth={1.75} />
            View store
          </Link>
          <div className="rounded-md bg-secondary px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" className="justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="size-4" strokeWidth={1.75} />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 transition-all duration-300 lg:hidden">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" className="gap-2 transition-all duration-200 hover:gap-3" onClick={handleSignOut}>
            <LogOut className="size-4" strokeWidth={1.75} />
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-4 transition-all duration-300 md:p-8">{children}</main>
      </div>
    </div>
  )
}
