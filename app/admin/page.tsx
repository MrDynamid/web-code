export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowUpRight, Images, Package, ShoppingBag, Star, Tags, TrendingUp } from 'lucide-react'
import { desc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllProducts } from '@/lib/products'
import { getAllBanners } from '@/lib/banners'
import { getAllCoupons } from '@/lib/coupons'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { formatPrice } from '@/lib/product-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [productRows, banners, coupons, recentOrders] = await Promise.all([
    getAllProducts(),
    getAllBanners(),
    getAllCoupons(),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
  ])

  const featuredCount = productRows.filter((p) => p.featured).length
  const activeBanners = banners.filter((b) => b.active).length
  const activeCoupons = coupons.filter((c) => c.active).length
  const lowStock = productRows.filter((p) => p.stock > 0 && p.stock <= 15)
  const paidOrders = recentOrders.filter((o) =>
    ['paid', 'processing', 'shipped', 'delivered'].includes(o.status),
  )
  const recentRevenue = paidOrders.reduce((s, o) => s + o.total, 0)

  const stats = [
    { label: 'Products', value: productRows.length, icon: Package, href: '/admin/products' },
    { label: 'Featured', value: featuredCount, icon: Star, href: '/admin/products' },
    { label: 'Active banners', value: activeBanners, icon: Images, href: '/admin/banners' },
    { label: 'Active coupons', value: activeCoupons, icon: Tags, href: '/admin/coupons' },
    { label: 'Recent orders', value: recentOrders.length, icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Recent revenue', value: formatPrice(recentRevenue), icon: TrendingUp, href: '/admin/orders' },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Overview</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-gold">
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 font-serif text-3xl tracking-tight">{stat.value}</p>
                </div>
                <stat.icon className="size-5 text-gold" strokeWidth={1.5} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl">Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-gold">
              <Link href="/admin/orders">All orders <ArrowUpRight className="size-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        #{o.id} · {o.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge
                        variant={['paid', 'delivered'].includes(o.status) ? 'default' : 'secondary'}
                        className="capitalize text-[10px]"
                      >
                        {o.status}
                      </Badge>
                      <span className="text-sm font-medium tabular-nums">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Low stock */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg">Low stock</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-gold">
                <Link href="/admin/products">Manage <ArrowUpRight className="size-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products well stocked.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.slice(0, 6).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5">
                      <span className="truncate text-sm">{p.name}</span>
                      <span className="ml-2 shrink-0 text-sm font-medium text-destructive">
                        {p.stock} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="justify-start gap-2">
                <Link href="/admin/products/new"><Package className="size-4" /> Add product</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/banners/new"><Images className="size-4" /> Add banner</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/coupons/new"><Tags className="size-4" /> Add coupon</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/orders"><ShoppingBag className="size-4" /> View orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
