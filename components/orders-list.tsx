"use client"

import { useState, useTransition } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cancelOrder } from "@/lib/account.actions"
import { formatDate, formatINR } from "@/lib/format"
import { OrderTracker } from "@/components/order-tracker"
import { cn } from "@/lib/utils"

type Order = {
  id: string
  order_number: string
  status: string
  total: number
  payment_method: string
  payment_status: string
  created_at: string
  items: unknown[]
}

const CANCELLABLE = new Set(["placed", "confirmed"])

const STATUS_TONE: Record<string, string> = {
  placed: "bg-secondary text-muted-foreground",
  confirmed: "bg-secondary text-foreground",
  packed: "bg-secondary text-foreground",
  shipped: "bg-primary/10 text-primary",
  out_for_delivery: "bg-primary/10 text-primary",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

export function OrdersList({ orders, highlight }: { orders: Order[]; highlight?: string }) {
  // The order highlighted after checkout starts expanded, so a shopper lands
  // straight on the tracker for the order they just placed.
  const [openId, setOpenId] = useState<string | null>(highlight ?? orders[0]?.id ?? null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function cancel(id: string) {
    setPendingId(id)
    startTransition(async () => {
      try {
        await cancelOrder({ id })
        toast.success("Order cancelled. Any payment will be refunded.")
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "Couldn't cancel that order.")
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => {
        const open = openId === order.id
        const itemCount = order.items.length

        return (
          <li
            key={order.id}
            className={cn(
              "overflow-hidden rounded-lg border bg-card transition-colors",
              order.id === highlight && "border-primary",
            )}
          >
            <div className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg">{order.order_number}</h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase",
                      STATUS_TONE[order.status] ?? "bg-secondary text-muted-foreground",
                    )}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(order.created_at)} · {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                  {order.payment_method === "cod" ? "Cash on delivery" : "Paid online"}
                </p>
              </div>

              <span className="text-sm font-medium tabular-nums">{formatINR(order.total)}</span>

              <div className="flex items-center gap-2">
                {CANCELLABLE.has(order.status) ? (
                  <button
                    type="button"
                    onClick={() => cancel(order.id)}
                    disabled={pendingId === order.id}
                    className="rounded-md border px-3 py-2 text-xs tracking-[0.12em] uppercase text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
                  >
                    {pendingId === order.id ? "Cancelling…" : "Cancel"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : order.id)}
                  aria-expanded={open}
                  className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs tracking-[0.12em] uppercase transition-colors hover:border-primary hover:text-primary"
                >
                  Track
                  <ChevronDown
                    width={13}
                    height={13}
                    strokeWidth={1.8}
                    className={cn("transition-transform duration-300", open && "rotate-180")}
                  />
                </button>
              </div>
            </div>

            {open ? (
              <div className="border-t p-5">
                <OrderTracker orderId={order.id} />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
