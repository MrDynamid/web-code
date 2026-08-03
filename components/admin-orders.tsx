"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateOrder } from "@/lib/admin.actions"
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

const STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const

type Status = (typeof STATUSES)[number]

const STATUS_TONE: Record<Status, string> = {
  placed: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/12 text-primary",
  packed: "bg-primary/12 text-primary",
  shipped: "bg-gold/20 text-foreground",
  out_for_delivery: "bg-gold/20 text-foreground",
  delivered: "bg-success/12 text-success",
  cancelled: "bg-destructive/12 text-destructive",
}

function OrderRow({ order }: { order: any }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(order.status as Status)
  const [tracking, setTracking] = useState(order.tracking_number ?? "")
  const [courier, setCourier] = useState(order.courier ?? "")
  const [pending, startTransition] = useTransition()

  const dirty =
    status !== order.status ||
    tracking !== (order.tracking_number ?? "") ||
    courier !== (order.courier ?? "")

  function save() {
    startTransition(async () => {
      try {
        await updateOrder({ id: order.id, status, tracking_number: tracking, courier })
        toast.success(`${order.order_number} updated`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update the order")
      }
    })
  }

  return (
    <TableRow>
      <TableCell className="align-top">
        <p className="font-medium">{order.order_number}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </TableCell>
      <TableCell className="align-top">
        <p className="truncate">{order.full_name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {order.city}, {order.state}
        </p>
      </TableCell>
      <TableCell className="align-top whitespace-nowrap">
        <p className="font-medium">{formatINR(order.total)}</p>
        <p className="mt-0.5 text-xs uppercase text-muted-foreground">
          {order.payment_method} · {order.payment_status}
        </p>
      </TableCell>
      <TableCell className="align-top">
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
            STATUS_TONE[order.status as Status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {String(order.status).replace(/_/g, " ")}
        </span>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex flex-col gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Status)}
            aria-label={`Status for ${order.order_number}`}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Input
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            placeholder="Tracking no."
            aria-label={`Tracking number for ${order.order_number}`}
            className="h-9"
          />
          <Input
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
            placeholder="Courier"
            aria-label={`Courier for ${order.order_number}`}
            className="h-9"
          />
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function AdminOrders({ orders }: { orders: any[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | Status>("all")

  const visible = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false
    if (!query.trim()) return true
    const needle = query.trim().toLowerCase()
    return (
      String(order.order_number).toLowerCase().includes(needle) ||
      String(order.full_name).toLowerCase().includes(needle) ||
      String(order.email).toLowerCase().includes(needle)
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order no., name or email"
          aria-label="Search orders"
          className="max-w-xs"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as "all" | Status)}
          aria-label="Filter by status"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {visible.length} of {orders.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No orders match this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-52">Fulfilment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
