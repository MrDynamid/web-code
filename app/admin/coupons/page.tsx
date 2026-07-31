import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllCoupons } from '@/lib/coupons'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteCoupon } from './actions'
import { cn } from '@/lib/utils'

export default async function AdminCouponsPage() {
  await requireAdmin()
  const coupons = await getAllCoupons()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Offers
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            Coupons
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/coupons/new">
            <Plus className="size-4" /> Add coupon
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min order</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium uppercase">{c.code}</TableCell>
                <TableCell>{c.label}</TableCell>
                <TableCell>
                  {c.type === 'percentage'
                    ? `${c.value}%`
                    : `₹${c.value}`}
                </TableCell>
                <TableCell>{c.minOrder === 0 ? 'Any order' : `₹${c.minOrder}`}</TableCell>
                <TableCell>
                  <Badge variant={c.active ? 'default' : 'secondary'}>
                    {c.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-8 text-muted-foreground hover:text-foreground',
                      )}
                      aria-label={`Edit ${c.code}`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteButton
                      id={c.id}
                      label={c.code}
                      action={deleteCoupon}
                      successMessage="Coupon deleted"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
