export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { CircleCheck as CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { getSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { formatPrice } from '@/lib/product-utils'
import { Button } from '@/components/ui/button'
import { OrderTracker } from '@/components/order-tracker'

export const metadata = { title: 'Order confirmed | Maison Lumière' }

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const { id: rawId } = await searchParams
  const orderId = Number(rawId)
  if (!orderId || !Number.isInteger(orderId)) notFound()

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
    .limit(1)

  if (!order) notFound()
  if (order.status !== 'paid') redirect('/orders')

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <div className="text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-gold/10">
          <CheckCircle2 className="size-8 text-gold" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-serif text-4xl tracking-tight md:text-5xl">
          Thank you for your order
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Order{' '}
          <span className="font-medium text-foreground">#{order.id}</span>
          {' '}· Confirmation sent to{' '}
          <span className="font-medium text-foreground">{order.email}</span>
        </p>
      </div>

      <div className="mt-12 rounded-sm border border-border bg-card p-6 md:p-8">
        <h2 className="font-serif text-2xl tracking-tight">Order summary</h2>
        <ul className="mt-6 divide-y divide-border">
          {order.items.map((item) => (
            <li key={`${item.id}-${item.color}-${item.size}`} className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.color} · {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {order.shipping === 0 ? 'Complimentary' : formatPrice(order.shipping)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Discount{order.couponCode ? ` (${order.couponCode})` : ''}
              </span>
              <span className="tabular-nums text-gold">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 font-medium">
            <span>Total</span>
            <span className="font-serif text-2xl tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-sm bg-secondary/50 p-4 text-sm">
          <p className="font-medium">Delivering to</p>
          <p className="mt-1 text-muted-foreground">
            {order.fullName} · {order.address}, {order.city}, {order.state} {order.zip}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-serif text-xl">Shipment status</h3>
        <OrderTracker order={order} />
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button asChild className="h-11 gap-2">
          <Link href="/orders">
            <Package className="size-4" strokeWidth={1.5} />
            View all orders
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 gap-2">
          <Link href="/products">
            Continue shopping
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
