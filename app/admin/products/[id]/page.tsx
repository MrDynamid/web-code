import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { ProductForm } from '@/components/admin/product-form'
import { updateProduct } from '../actions'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId)) notFound()

  const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  const product = rows[0]
  if (!product) notFound()

  const action = updateProduct.bind(null, product.id)

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Products
      </Link>
      <h1 className="mt-3 mb-8 font-serif text-3xl tracking-tight md:text-4xl">
        Edit product
      </h1>
      <ProductForm action={action} product={product} mode="edit" />
    </div>
  )
}
