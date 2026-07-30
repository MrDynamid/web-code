import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { ProductForm } from '@/components/admin/product-form'
import { createProduct } from '../actions'

export default async function NewProductPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Products
      </Link>
      <h1 className="mt-3 mb-8 font-serif text-3xl tracking-tight md:text-4xl">
        New product
      </h1>
      <ProductForm action={createProduct} mode="create" />
    </div>
  )
}
