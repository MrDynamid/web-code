"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveProduct } from "@/lib/admin.actions"
import { formatINR } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * `saveProduct` validates a whole product, so an inline stock edit resubmits the
 * row it came from with only `stock` changed. That keeps the single server
 * action authoritative instead of adding a second, looser write path.
 */
function StockCell({ product }: { product: any }) {
  const router = useRouter()
  const [stock, setStock] = useState(String(product.stock ?? 0))
  const [pending, startTransition] = useTransition()

  const parsed = Number(stock)
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 100000
  const dirty = valid && parsed !== product.stock

  function save() {
    if (!dirty) return
    startTransition(async () => {
      try {
        await saveProduct({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description ?? "",
          details: product.details ?? "",
          fabric: product.fabric ?? "",
          care: product.care ?? "",
          price: product.price,
          compare_at_price: product.compare_at_price ?? null,
          category_slug: product.category_slug,
          images: product.images ?? [],
          colors: product.colors ?? [],
          sizes: product.sizes ?? [],
          badge: product.badge ?? null,
          featured: Boolean(product.featured),
          stock: parsed,
        })
        toast.success(`${product.name} stock set to ${parsed}`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update stock")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={stock}
        onChange={(event) => setStock(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) save()
        }}
        inputMode="numeric"
        aria-label={`Stock for ${product.name}`}
        aria-invalid={!valid}
        className={cn("h-9 w-20", !valid && "border-destructive")}
      />
      <Button size="sm" variant="outline" onClick={save} disabled={pending || !dirty}>
        {pending ? "…" : "Set"}
      </Button>
    </div>
  )
}

export function AdminInventory({ products }: { products: any[] }) {
  const [query, setQuery] = useState("")
  const [lowOnly, setLowOnly] = useState(false)

  const visible = products.filter((product) => {
    if (lowOnly && product.stock > 5) return false
    if (!query.trim()) return true
    const needle = query.trim().toLowerCase()
    return (
      String(product.name).toLowerCase().includes(needle) ||
      String(product.slug).toLowerCase().includes(needle) ||
      String(product.category_slug).toLowerCase().includes(needle)
    )
  })

  const lowCount = products.filter((product) => product.stock <= 5).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, SKU or category"
          aria-label="Search inventory"
          className="max-w-xs"
        />
        <Button
          variant={lowOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLowOnly((value) => !value)}
        >
          Low stock ({lowCount})
        </Button>
        <span className="text-sm text-muted-foreground">
          {visible.length} of {products.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No products match this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-40">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.slug}</p>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {String(product.category_slug).replace(/-/g, " ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatINR(product.price)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(product.rating).toFixed(1)} · {product.review_count}
                  </TableCell>
                  <TableCell>
                    <StockCell product={product} />
                    {product.stock <= 0 ? (
                      <p className="mt-1 text-[11px] text-destructive">Sold out</p>
                    ) : product.stock <= 5 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">Low</p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
