'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders, ORDER_STATUSES, type OrderStatus } from '@/lib/db/schema'

// Statuses an admin can move an order into (payment sets "paid" automatically).
const ADMIN_SETTABLE: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered', 'cancelled']

export type OrderStatusState = { error?: string; success?: boolean } | null

export async function updateOrderStatus(
  _prev: OrderStatusState,
  formData: FormData,
): Promise<OrderStatusState> {
  await requireAdmin()

  const orderId = Number(formData.get('orderId'))
  const status = String(formData.get('status') ?? '') as OrderStatus
  const trackingNumber = String(formData.get('trackingNumber') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { error: 'Invalid order.' }
  }
  if (!ORDER_STATUSES.includes(status) || !ADMIN_SETTABLE.includes(status)) {
    return { error: 'Invalid status.' }
  }

  const [existing] = await db
    .select({ statusHistory: orders.statusHistory })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!existing) return { error: 'Order not found.' }

  const history = [
    ...(existing.statusHistory ?? []),
    {
      status,
      at: new Date().toISOString(),
      ...(note ? { note } : {}),
    },
  ]

  await db
    .update(orders)
    .set({
      status,
      statusHistory: history,
      ...(trackingNumber ? { trackingNumber } : {}),
    })
    .where(eq(orders.id, orderId))

  revalidatePath('/admin/orders')
  revalidatePath('/orders')
  return { success: true }
}
