import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart, Package, ArrowRight } from 'lucide-react'
import { getSession } from '@/lib/admin-auth'
import { getUserOrders } from '@/app/actions/orders'
import { getWishlistProducts } from '@/app/actions/wishlist'
import { SignOutButton } from '@/components/sign-out-button'

export const metadata = {
  title: 'My account',
}

export default async function AccountPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login?redirect=/account')

  const [orders, wishlist] = await Promise.all([
    getUserOrders(),
    getWishlistProducts(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">My account</p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
          Hello, {session.user.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/orders"
          className="group flex flex-col gap-4 rounded-sm border border-border bg-card p-6 transition-colors hover:border-foreground/30"
        >
          <div className="flex items-center justify-between">
            <Package className="size-6 text-gold" strokeWidth={1.5} />
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length === 0
                ? 'You have no orders yet.'
                : `${orders.length} order${orders.length > 1 ? 's' : ''} placed.`}
            </p>
          </div>
        </Link>

        <Link
          href="/wishlist"
          className="group flex flex-col gap-4 rounded-sm border border-border bg-card p-6 transition-colors hover:border-foreground/30"
        >
          <div className="flex items-center justify-between">
            <Heart className="size-6 text-gold" strokeWidth={1.5} />
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Wishlist</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {wishlist.length === 0
                ? 'Nothing saved yet.'
                : `${wishlist.length} piece${wishlist.length > 1 ? 's' : ''} saved.`}
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <SignOutButton />
      </div>
    </div>
  )
}
