'use server'

import crypto from 'crypto'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
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
type PaymentMethod = 'razorpay' | 'cod'

type CreateOrderResult =
  | {
      ok: true
      orderDbId: number
      amount: number
      discount: number
      currency: string
      paymentMethod: PaymentMethod
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
  paymentMethod: PaymentMethod = 'cod',
): Promise<CreateOrderResult> {
  const userId = await getSessionUserId()

  if (!Array.isArray(cart) || cart.length === 0) {
    return { ok: false, error: 'Your bag is empty.' }
  }

  for (const line of cart) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10) {
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
    if (product.stock < line.quantity) {
      return {
        ok: false,
        error: `"${product.name}" only has ${product.stock} in stock. Please adjust your bag.`,
      }
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
        error: `Spend at least ₹${Math.round(coupon.minOrder / 100)} to use this code.`,
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

  // Cash on Delivery — mark as confirmed immediately, no payment gateway needed.
  if (paymentMethod === 'cod') {
    const now = new Date().toISOString()
    for (const item of items) {
      await db
        .update(products)
        .set({ stock: sql`GREATEST(stock - ${item.quantity}, 0)` })
        .where(eq(products.id, item.id))
    }
    await db
      .update(orders)
      .set({
        status: 'paid',
        statusHistory: [{ status: 'paid', at: now, note: 'Cash on Delivery' }],
      })
      .where(eq(orders.id, order.id))

    revalidatePath('/orders')
    revalidatePath('/account')
    revalidatePath('/products')

    return {
      ok: true,
      orderDbId: order.id,
      amount: total,
      discount,
      currency: 'INR',
      paymentMethod: 'cod',
      razorpayOrderId: null,
      keyId: null,
      customer,
    }
  }

  // Razorpay online payment
  if (!razorpayConfigured || !razorpay || !process.env.RAZORPAY_KEY_ID) {
    return { ok: false, error: 'Online payments are not configured. Please choose Cash on Delivery.' }
  }

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
    paymentMethod: 'razorpay',
    razorpayOrderId: rzpOrder.id,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    customer,
  }
}

/**
 * Verifies the Razorpay payment signature and marks the order paid.
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

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex')

  const expectedBuf = Buffer.from(expectedHex, 'hex')
  const actualBuf = Buffer.from(params.razorpaySignature, 'hex')

  const signatureValid =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf)

  if (!signatureValid) {
    return { ok: false, error: 'Payment verification failed.' }
  }

  const [stored] = await db
    .select({
      razorpayOrderId: orders.razorpayOrderId,
      status: orders.status,
      items: orders.items,
    })
    .from(orders)
    .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))
    .limit(1)

  if (!stored || stored.razorpayOrderId !== params.razorpayOrderId) {
    return { ok: false, error: 'Order verification failed.' }
  }

  if (stored.status === 'paid') return { ok: true }

  const now = new Date().toISOString()

  for (const item of stored.items) {
    await db
      .update(products)
      .set({ stock: sql`GREATEST(stock - ${item.quantity}, 0)` })
      .where(eq(products.id, item.id))
  }

  await db
    .update(orders)
    .set({
      status: 'paid',
      razorpayPaymentId: params.razorpayPaymentId,
      statusHistory: [{ status: 'paid', at: now, note: 'Payment received via Razorpay' }],
    })
    .where(and(eq(orders.id, params.orderDbId), eq(orders.userId, userId)))

  revalidatePath('/orders')
  revalidatePath('/account')
  revalidatePath('/products')
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

/**
 * Cancels the authenticated user's own order if it has not yet shipped.
 */
export async function cancelOrder(
  orderId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getSessionUserId()

  const [order] = await db
    .select({ status: orders.status, statusHistory: orders.statusHistory })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  if (!order) return { ok: false, error: 'Order not found.' }

  if (['shipped', 'delivered'].includes(order.status)) {
    return {
      ok: false,
      error: 'This order has already shipped. Please request a return instead.',
    }
  }
  if (order.status === 'cancelled') {
    return { ok: false, error: 'This order is already cancelled.' }
  }

  const history = [
    ...(order.statusHistory ?? []),
    { status: 'cancelled', at: new Date().toISOString(), note: 'Cancelled by customer' },
  ]

  await db
    .update(orders)
    .set({ status: 'cancelled', statusHistory: history })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

  revalidatePath('/orders')
  return { ok: true }
}
