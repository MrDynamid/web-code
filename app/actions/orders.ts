'use server'

import crypto from 'crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { orders, products, type OrderItem } from '@/lib/db/schema'
import { getSessionUserId, getSession } from '@/lib/admin-auth'
import { razorpay, razorpayConfigured } from '@/lib/razorpay'

const FREE_SHIPPING_THRESHOLD = 20000
const SHIPPING_FEE = 1200

export type ShippingDetails = {
  email: string
  fullName: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
}

type CartLine = { id: number; size: string; color: string; quantity: number }

type CreateOrderResult =
  | {
      ok: true
      configured: boolean
      orderDbId: number
      amount: number
      currency: string
      razorpayOrderId: string | null
      keyId: string | null
      customer: { name: string; email: string; contact: string }
    }
  | { ok: false; error: string }

/**
 * Creates an order. Prices and totals are always recomputed on the server from
 * the products table — the client-submitted cart is only used for product ids,
 * variants and quantities, never for pricing.
 */
export async function createOrder(
  cart: CartLine[],
  shipping: ShippingDetails,
): Promise<CreateOrderResult> {
  const userId = await getSessionUserId()

  if (!Array.isArray(cart) || cart.length === 0) {
    return { ok: false, error: 'Your bag is empty.' }
  }

  // Validate quantities.
  for (const line of cart) {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 10
    ) {
      return { ok: false, error: 'Invalid quantity in your bag (max 10 per item).' }
    }
  }

  const ids = [...new Set(cart.map((l) => l.id))]
  const rows = await db.select().from(products).where(inArray(products.id, ids))
  const byId = new Map(rows.map((r) => [r.id, r]))

  const items: OrderItem[] = []
  let subtotal = 0

  for (const line of cart) {
    const product = byId.get(line.id)
    if (!product) {
      return { ok: false, error: 'One of the items is no longer available.' }
    }
    subtotal += product.price * line.quantity
    items.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? '/placeholder.svg',
      color: line.color,
      size: line.size,
      price: product.price,
      quantity: line.quantity,
    })
  }

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shippingCost

  // Persist the order in a "created" state first so we always have a record.
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      email: shipping.email,
      fullName: shipping.fullName,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zip,
      phone: shipping.phone ?? null,
      items,
      subtotal,
      shipping: shippingCost,
      total,
      currency: 'INR',
      status: 'created',
    })
    .returning()

  const customer = {
    name: shipping.fullName,
    email: shipping.email,
    contact: shipping.phone ?? '',
  }

  // If Razorpay isn't configured, return so the UI can show a clear message.
  if (!razorpayConfigured || !razorpay) {
    return {
      ok: true,
      configured: false,
      orderDbId: order.id,
      amount: total,
      currency: 'INR',
      razorpayOrderId: null,
      keyId: null,
      customer,
    }
  }

  // Razorpay expects the amount in the smallest currency unit (paise).
  const rzpOrder = await razorpay.orders.create({
    amount: total * 100,
    currency: 'INR',
    receipt: `order_${order.id}`,
    notes: { orderDbId: String(order.id), userId },
  })

  await db
    .update(orders)
    .set({ razorpayOrderId: rzpOrder.id })
    .where(and(eq(orders.id, order.id), eq(orders.userId, userId)))

  return {
    ok: true,
    configured: true,
    orderDbId: order.id,
    amount: total,
    currency: 'INR',
    razorpayOrderId: rzpOrder.id,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    customer,
  }
}

/**
 * Verifies the Razorpay payment signature and marks the order paid. The
 * signature check guarantees the callback genuinely came from Razorpay.
 */
export async function verifyPayment(params: {
  orderDbId: number
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getSessionUserId()
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return { ok: false, error: 'Payments are not configured.' }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex')

  if (expected !== params.razorpaySignature) {
    await db
      .update(orders)
      .set({ status: 'failed' })
      .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))
    return { ok: false, error: 'Payment verification failed.' }
  }

  await db
    .update(orders)
    .set({
      status: 'paid',
      razorpayPaymentId: params.razorpayPaymentId,
    })
    .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))

  revalidatePath('/orders')
  revalidatePath('/account')
  return { ok: true }
}

/**
 * Marks an order as paid for the demo/unconfigured flow (no real charge).
 */
export async function markOrderDemoPaid(orderDbId: number) {
  const userId = await getSessionUserId()
  await db
    .update(orders)
    .set({ status: 'paid' })
    .where(and(eq(orders.id, orderDbId), eq(orders.userId, userId)))
  revalidatePath('/orders')
  revalidatePath('/account')
}

export async function getUserOrders() {
  const session = await getSession()
  if (!session?.user) return []
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
}
