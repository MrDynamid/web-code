export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CircleCheck as CheckCircle2, Clock3, Package, Truck, Circle as XCircle } from 'lucide-react'
import { getSession } from '@/lib/admin-auth'
import { getUserOrders } from '@/app/actions/orders'
import { formatPrice } from '@/lib/product-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderTracker } from '@/components/order-tracker'
import { CancelOrderButton } from '@/components/cancel-order-button'

export const metadata = { title: 'My orders | Maison Lumière' }

function statusBadge(status: string) {
  switch (status) {
    case 'paid':        return { icon: CheckCircle2, label: 'Confirmed',  variant: 'default' as const }
    case 'processing':  return { icon: Package,      label: 'Processing', variant: 'secondary' as const }
    case 'shipped':     return { icon: Truck,         label: 'Shipped',    variant: 'secondary' as const }
    case 'delivered':   return { icon: CheckCircle2,  label: 'Delivered',  variant: 'default' as const }
    case 'cancelled':   return { icon: XCircle,       label: 'Cancelled',  variant: 'destructive' as const }
    default:            return { icon: Clock3,        label: 'Pending',    variant: 'secondary' as const }
  }
}

export default async function OrdersPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login?redirect=/orders')
  const orders = await getUserOrders()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">My account</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Package className="size-10 text-gold" strokeWidth={1.4} />
          <h2 className="font-serif text-2xl">No orders yet</h2>
          <p className="text-sm text-muted-foreground">Your confirmed purchases will appear here.</p>
          <Button asChild className="mt-2">
            <Link href="/products">Shop the collection</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {orders.map((order) => {
            const { icon: Icon, label, variant } = statusBadge(order.status)
            const cancellable = !['shipped', 'delivered', 'cancelled', 'failed'].includes(order.status)

            return (
              <article key={order.id} className="rounded-sm border border-border bg-card p-5 md:p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="font-serif text-xl">Order #{order.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={variant} className="gap-1.5 capitalize">
                      <Icon className="size-3.5" />
                      {label}
                    </Badge>
                    {cancellable && <CancelOrderButton orderId={order.id} />}
                  </div>
                </div>

                {/* Items */}
                <ul className="divide-y divide-border">
                  {order.items.map((item) => (
                    <li key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4 py-4">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <Link href={`/products/${item.slug}`} className="font-medium hover:text-gold">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.color} · {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Tracker */}
                <OrderTracker order={order} />

                {/* Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {order.couponCode && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 uppercase tracking-wide">
                        Code: {order.couponCode}
                        {order.discount > 0 && (
                          <span className="font-medium text-gold">
                            −{formatPrice(order.discount)}
                          </span>
                        )}
                      </span>
                    )}
                    {order.shipping === 0 && order.subtotal > 0 && (
                      <span className="rounded-full bg-secondary px-2.5 py-1 uppercase tracking-wide">
                        Free shipping
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Order total</p>
                    <p className="font-serif text-2xl tabular-nums">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
