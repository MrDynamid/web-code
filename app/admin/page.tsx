import Link from 'next/link'
import { ArrowUpRight, Images, Package, Star, Tags, TrendingUp } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllProducts } from '@/lib/products'
import { getAllBanners } from '@/lib/banners'
import { getAllCoupons } from '@/lib/coupons'
import { formatPrice } from '@/lib/product-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [products, banners, coupons] = await Promise.all([
    getAllProducts(),
    getAllBanners(),
    getAllCoupons(),
  ])

  const featuredCount = products.filter((p) => p.featured).length
  const activeBanners = banners.filter((b) => b.active).length
  const activeCoupons = coupons.filter((c) => c.active).length
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.stock <= 15)

  const stats = [
    { label: 'Products', value: products.length, icon: Package, href: '/admin/products' },
    { label: 'Featured', value: featuredCount, icon: Star, href: '/admin/products' },
    { label: 'Active banners', value: activeBanners, icon: Images, href: '/admin/banners' },
    {
      label: 'Active coupons',
      value: activeCoupons,
      icon: Tags,
      href: '/admin/coupons',
    },
    {
      label: 'Inventory value',
      value: formatPrice(inventoryValue),
      icon: TrendingUp,
      href: '/admin/products',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
          Overview
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl">Low stock</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-gold">
              <Link href="/admin/products">
                Manage <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All products are comfortably stocked.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <span className="text-sm">{p.name}</span>
                    <span className="text-sm font-medium text-destructive">
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="justify-start gap-2">
              <Link href="/admin/products/new">
                <Package className="size-4" /> Add product
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="/admin/banners/new">
                <Images className="size-4" /> Add banner
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link href="/admin/coupons/new">
                <Tags className="size-4" /> Add coupon
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
