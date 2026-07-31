import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Clock3, Package, XCircle } from 'lucide-react'
import { getSession } from '@/lib/admin-auth'
import { getUserOrders } from '@/app/actions/orders'
import { formatPrice } from '@/lib/product-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderTracker } from '@/components/order-tracker'

export const metadata = { title: 'My orders | Maison Lumière' }

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
          <Button asChild><Link href="/products">Shop the collection</Link></Button>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="rounded-sm border border-border bg-card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="font-serif text-xl">Order #{order.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="gap-1.5 capitalize">
                  {order.status === 'paid' ? <CheckCircle2 className="size-3.5" /> : order.status === 'failed' ? <XCircle className="size-3.5" /> : <Clock3 className="size-3.5" />}
                  {order.status.replaceAll('_', ' ')}
                </Badge>
              </div>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4 py-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                      <Image src={item.image || '/placeholder.svg'} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <Link href={`/products/${item.slug}`} className="font-medium hover:text-gold">{item.name}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{item.color} · {item.size} · Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end border-t border-border pt-4">
                <div className="text-right"><p className="text-xs text-muted-foreground">Total</p><p className="font-serif text-2xl">{formatPrice(order.total)}</p></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
