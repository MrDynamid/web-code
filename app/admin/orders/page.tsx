import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin-auth'
import { formatPrice } from '@/lib/product-utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminOrdersPage() {
  await requireAdmin()
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100)
  return <div className="mx-auto max-w-6xl">
    <div className="mb-8"><p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Commerce</p><h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">Orders</h1></div>
    <Card><CardHeader><CardTitle className="font-serif">Latest orders</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b"><tr><th className="py-3">Order</th><th>Customer</th><th>Status</th><th>Offer</th><th>Total</th><th>Date</th></tr></thead><tbody className="divide-y">{rows.map(o => <tr key={o.id}><td className="py-4 font-medium">#{o.id}</td><td><div>{o.fullName}</div><div className="text-xs text-muted-foreground">{o.email}</div></td><td><Badge variant={o.status === 'paid' ? 'default' : 'secondary'} className="capitalize">{o.status.replaceAll('_',' ')}</Badge></td><td className="text-xs text-muted-foreground uppercase">{o.couponCode ?? '—'}</td><td>{formatPrice(o.total)}</td><td className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>
}
