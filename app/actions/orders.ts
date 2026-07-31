'use server'

import crypto from 'crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { orders, products, type OrderItem } from '@/lib/db/schema'
import { getSessionUserId, getSession } from '@/lib/admin-auth'
import { getActiveCouponByCode } from '@/lib/coupons'
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
      orderDbId: number
      amount: number
      discount: number
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
  couponCode?: string,
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

  let discount = 0
  let appliedCouponCode: string | null = null

  if (couponCode?.trim()) {
    const normalized = couponCode.trim().toUpperCase()
    const coupon = await getActiveCouponByCode(normalized)

    if (!coupon) {
      return { ok: false, error: 'That redeem code is invalid or no longer active.' }
    }

    if (subtotal < coupon.minOrder) {
      return {
        ok: false,
        error: `Spend at least ${Math.round(coupon.minOrder / 100)} rupees to use this code.`,
      }
    }

    if (coupon.type === 'percentage') {
      discount = Math.floor((subtotal * coupon.value) / 100)
    } else {
      discount = Math.min(coupon.value, subtotal)
    }

    appliedCouponCode = coupon.code
  }

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = Math.max(0, subtotal + shippingCost - discount)

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
      discount,
      couponCode: appliedCouponCode,
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

  // Hard payment wall: checkout cannot succeed when Razorpay is unavailable.
  if (!razorpayConfigured || !razorpay || !process.env.RAZORPAY_KEY_ID) {
    await db.update(orders).set({ status: 'payment_unavailable' }).where(eq(orders.id, order.id))
    return { ok: false, error: 'Online payments are temporarily unavailable.' }
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
    orderDbId: order.id,
    amount: total,
    discount,
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

  const [stored] = await db
    .select({ razorpayOrderId: orders.razorpayOrderId, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))
    .limit(1)

  if (!stored || stored.razorpayOrderId !== params.razorpayOrderId) {
    return { ok: false, error: 'Order verification failed.' }
  }

  if (stored.status === 'paid') return { ok: true }

  if (expected !== params.razorpaySignature) {
    await db
      .update(orders)
      .set({ status: 'failed' })
      .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))
    return { ok: false, error: 'Payment verification failed.' }
  }

  const now = new Date().toISOString()
  await db
    .update(orders)
    .set({
      status: 'paid',
      razorpayPaymentId: params.razorpayPaymentId,
      statusHistory: [{ status: 'paid', at: now, note: 'Payment received' }],
    })
    .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))

  revalidatePath('/orders')
  revalidatePath('/account')
  return { ok: true }
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
