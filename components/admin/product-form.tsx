'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/lib/db/schema'
import { CATEGORIES } from '@/lib/product-utils'
import type { ProductActionState } from '@/app/admin/products/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

type Action = (
  prev: ProductActionState,
  formData: FormData,
) => Promise<ProductActionState>

function dollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toString()
}

export function ProductForm({
  action,
  product,
  mode,
}: {
  action: Action
  product?: Product
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0])

  const [state, formAction, pending] = useActionState(
    async (prev: ProductActionState, formData: FormData) => {
      const result = await action(prev, formData)
      if (result?.success) {
        toast.success(mode === 'create' ? 'Product created' : 'Product updated')
        router.push('/admin/products')
        router.refresh()
      } else if (result?.error) {
        toast.error(result.error)
      }
      return result
    },
    null,
  )

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={product?.name} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={product?.slug}
                placeholder="Auto-generated from name if left blank"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product?.description}
                rows={3}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                name="details"
                defaultValue={product?.details ?? ''}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="materials">Materials</Label>
              <Input
                id="materials"
                name="materials"
                defaultValue={product?.materials ?? ''}
                placeholder="e.g. 100% mulberry silk"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="images">Image paths</Label>
              <Input
                id="images"
                name="images"
                defaultValue={product?.images?.join(', ')}
                placeholder="/products/silk-slip-dress.png"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated paths. Leave blank to use a placeholder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={category} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  inputMode="decimal"
                  defaultValue={dollars(product?.price)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compareAtPrice">Compare at ($)</Label>
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  inputMode="decimal"
                  defaultValue={dollars(product?.compareAtPrice)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                defaultValue={product?.stock ?? 25}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="badge">Badge</Label>
              <Input
                id="badge"
                name="badge"
                defaultValue={product?.badge ?? ''}
                placeholder="e.g. New, Bestseller"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colors">Colors</Label>
              <Input
                id="colors"
                name="colors"
                defaultValue={product?.colors?.join(', ')}
                placeholder="Champagne, Black, Ivory"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sizes">Sizes</Label>
              <Input
                id="sizes"
                name="sizes"
                defaultValue={product?.sizes?.join(', ')}
                placeholder="XS, S, M, L"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <Label htmlFor="featured" className="cursor-pointer">
                Featured
              </Label>
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              <input type="hidden" name="featured" value={featured ? 'on' : ''} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === 'create' ? 'Create product' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
