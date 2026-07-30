import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllProducts } from '@/lib/products'
import { formatPrice } from '@/lib/product-utils'
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
import { deleteProduct } from './actions'
import { cn } from '@/lib/utils'

export default async function AdminProductsPage() {
  await requireAdmin()
  const products = await getAllProducts()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Catalog
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/products/new">
            <Plus className="size-4" /> Add product
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[52px]" />
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden text-right md:table-cell">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded bg-muted">
                    <Image
                      src={p.images[0] || '/placeholder.svg'}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.featured && (
                      <Badge variant="secondary" className="text-[10px]">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{p.slug}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{p.category}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(p.price)}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  <span
                    className={cn(
                      'tabular-nums',
                      p.stock <= 15 && 'font-medium text-destructive',
                    )}
                  >
                    {p.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-8 text-muted-foreground hover:text-foreground',
                      )}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteButton
                      id={p.id}
                      label={p.name}
                      action={deleteProduct}
                      successMessage="Product deleted"
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
