import { Check, CreditCard, Package, PackageCheck, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/db/schema'

const STEPS = [
  { key: 'paid', label: 'Confirmed', icon: CreditCard },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
] as const

const ORDER: Record<string, number> = {
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
}

function whenReached(order: Order, statusKey: string): string | null {
  const entry = order.statusHistory?.find((h) => h.status === statusKey)
  if (!entry) return null
  return new Date(entry.at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Horizontal fulfillment timeline shown on paid orders. Cancelled orders show a
 * simple notice instead of the progress track.
 */
export function OrderTracker({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="mt-4 rounded-sm border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        This order was cancelled.
      </div>
    )
  }

  // Only show tracking once payment is confirmed.
  if (!['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
    return null
  }

  const current = ORDER[order.status] ?? 0

  return (
    <div className="mt-4">
      {order.trackingNumber && (
        <p className="mb-4 text-xs text-muted-foreground">
          Tracking number:{' '}
          <span className="font-medium text-foreground">{order.trackingNumber}</span>
        </p>
      )}
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const done = index <= current
          const isLast = index === STEPS.length - 1
          const Icon = done && index < current ? Check : step.icon
          const date = whenReached(order, step.key)
          return (
            <li
              key={step.key}
              className={cn('flex flex-1 items-center', isLast && 'flex-none')}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border transition-colors',
                    done
                      ? 'border-gold bg-gold text-gold-foreground'
                      : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                <span className="h-3 text-[10px] text-muted-foreground">{date ?? ''}</span>
              </div>
              {!isLast && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors',
                    index < current ? 'bg-gold' : 'bg-border',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
