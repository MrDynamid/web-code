"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { addresses, coupons, orderEvents, orders, paymentTransactions, products } from "@/db/schema"
import { requireUserId } from "@/lib/session"
import { getPublishableKey, stripe } from "@/lib/stripe"

/**
 * Same contract as `placeOrder`: the client only identifies the line, and the
 * amount charged is always recomputed from the catalogue below. `name`, `image`
 * and `price` are optional hints so a browser can never imply a price.
 */
const cartItemSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200).optional().default(""),
  image: z.string().max(500).optional().default(""),
  price: z.number().int().min(0).optional().default(0),
  size: z.string().max(40),
  color: z.string().max(60),
  quantity: z.number().int().min(1).max(20),
})

const checkoutInput = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(6).max(20),
  line1: z.string().min(4).max(200),
  line2: z.string().max(200).optional().default(""),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().min(4).max(10),
  coupon_code: z.string().max(40).optional().default(""),
  save_address: z.boolean().optional().default(true),
  items: z.array(cartItemSchema).min(1).max(40),
})

function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MH-${stamp}-${rand}`
}

/** Absolute origin so Stripe can build the return_url. */
async function requestOrigin() {
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}`
}

/**
 * Phase 1 of online payment: re-price everything on the server, create the
 * order in a `pending` state, then open a Stripe Embedded Checkout session in
 * INR. The client only receives a client_secret — never a price it can edit.
 */
export async function createStripeCheckout(input: z.input<typeof checkoutInput>) {
  const userId = await requireUserId()
  const data = checkoutInput.parse(input)

  // Re-price against the live catalogue; never trust client prices.
  const catalogue = await db
    .select({
      slug: products.slug,
      name: products.name,
      price: products.price,
      images: products.images,
      stock: products.stock,
    })
    .from(products)
    .where(
      inArray(
        products.slug,
        data.items.map((item) => item.slug),
      ),
    )

  const bySlug = new Map(catalogue.map((p) => [p.slug, p]))

  // Collapse duplicate lines so the 20-unit cap applies to the aggregate.
  const merged = new Map<string, z.infer<typeof cartItemSchema>>()
  for (const item of data.items) {
    const key = `${item.slug}::${item.size}::${item.color}`
    const existing = merged.get(key)
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item)
  }

  const items = [...merged.values()].map((item) => {
    const product = bySlug.get(item.slug)
    if (!product) throw new Error(`${item.name || item.slug} is no longer available.`)
    if (item.quantity > 20) throw new Error(`You can order at most 20 of ${product.name}.`)
    return {
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? item.image,
      price: product.price,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }
  })

  const demandBySlug = new Map<string, number>()
  for (const item of items) {
    demandBySlug.set(item.slug, (demandBySlug.get(item.slug) ?? 0) + item.quantity)
  }
  const outOfStock = [...demandBySlug.entries()].filter(([slug, qty]) => {
    const product = bySlug.get(slug)
    return !product || product.stock < qty
  })
  if (outOfStock.length > 0) {
    const names = outOfStock.map(([slug]) => bySlug.get(slug)?.name ?? slug)
    throw new Error(`${names.join(", ")} just sold out. Please update your bag.`)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 2999 ? 0 : 149

  let discount = 0
  let couponCode: string | null = null
  if (data.coupon_code) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, data.coupon_code.toUpperCase()), eq(coupons.active, true)))
      .limit(1)

    const notExpired = !coupon?.expires_at || new Date(coupon.expires_at).getTime() > Date.now()
    const underLimit = coupon?.usage_limit === null || (coupon && coupon.times_used < coupon.usage_limit!)

    if (coupon && subtotal >= coupon.min_order && notExpired && underLimit) {
      discount =
        coupon.type === "percentage"
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal)
      couponCode = coupon.code
    }
  }

  const total = Math.max(0, subtotal + shipping - discount)
  if (total <= 0) throw new Error("Order total must be greater than zero for online payment.")

  // Create the pending order up front so we have an id to attach to Stripe.
  const [order] = await db
    .insert(orders)
    .values({
      user_id: userId,
      order_number: makeOrderNumber(),
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      items,
      subtotal,
      shipping,
      discount,
      coupon_code: couponCode,
      total,
      payment_method: "stripe",
      payment_status: "pending",
      status: "pending",
      status_history: [{ status: "pending", at: new Date().toISOString() }],
    })
    .returning({ id: orders.id, order_number: orders.order_number, total: orders.total })

  // One line item covering the full order total in paise (INR minor unit).
  // Discount + shipping are already folded into `total`, so this is exact.
  const origin = await requestOrigin()
  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: "embedded",
      mode: "payment",
      currency: "inr",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: total * 100, // rupees -> paise
            product_data: {
              name: `MEHR order ${order.order_number}`,
              description: items
                .map((i) => `${i.name} (${i.size}) x${i.quantity}`)
                .join(", ")
                .slice(0, 500),
            },
          },
        },
      ],
      customer_email: data.email,
      return_url: `${origin}/checkout?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        user_id: userId,
      },
    },
    // Idempotency: a retried request for the same order can't create a 2nd session/charge.
    { idempotencyKey: `checkout_${order.id}` },
  )

  // Record the payment attempt + link the Stripe session for later verification.
  await db.insert(paymentTransactions).values({
    order_id: order.id,
    user_id: userId,
    method: "stripe",
    channel: "card",
    amount: total,
    status: "pending",
    reference: session.id,
  })

  await db.update(orders).set({ payment_reference: session.id }).where(eq(orders.id, order.id))

  if (data.save_address) {
    const [existing] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(
        and(
          eq(addresses.user_id, userId),
          eq(addresses.line1, data.line1),
          eq(addresses.pincode, data.pincode),
        ),
      )
      .limit(1)
    if (!existing) {
      await db.insert(addresses).values({
        user_id: userId,
        full_name: data.full_name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        is_default: true,
      })
    }
  }

  return {
    client_secret: session.client_secret,
    publishable_key: getPublishableKey(),
    order_id: order.id,
    order_number: order.order_number,
  }
}

/**
 * Phase 2: after Stripe redirects back with a session_id, verify the session
 * was actually paid before flipping the order to paid and decrementing stock.
 * Verification is server-to-Stripe, so the client cannot fake a "paid" state.
 */
export async function confirmStripeCheckout(input: { session_id: string }) {
  const userId = await requireUserId()
  const data = z.object({ session_id: z.string().min(8).max(255) }).parse(input)

  const session = await stripe.checkout.sessions.retrieve(data.session_id)
  const orderId = session.metadata?.order_id
  if (!orderId || session.metadata?.user_id !== userId) {
    throw new Error("We couldn't match this payment to your account.")
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.user_id, userId)))
    .limit(1)
  if (!order) throw new Error("Order not found.")

  // Already reconciled (e.g. user refreshed the return page) — return as-is.
  if (order.payment_status === "paid") {
    return { order_number: order.order_number, status: "paid" as const }
  }

  if (session.payment_status !== "paid") {
    return { order_number: order.order_number, status: "unpaid" as const }
  }

  // Mark paid + advance to "placed", record the captured transaction.
  const history = Array.isArray(order.status_history) ? order.status_history : []
  const updated = await db
    .update(orders)
    .set({
      payment_status: "paid",
      status: "placed",
      payment_reference: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
      status_history: [...history, { status: "placed", at: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.payment_status, "pending")))
    .returning({ id: orders.id })

  // Only the request that actually flipped pending -> paid does the side effects,
  // so a double-submit can't decrement stock twice.
  if (updated.length === 0) {
    return { order_number: order.order_number, status: "paid" as const }
  }

  await db
    .update(paymentTransactions)
    .set({ status: "captured" })
    .where(and(eq(paymentTransactions.order_id, orderId), eq(paymentTransactions.status, "pending")))

  await db.insert(orderEvents).values({
    order_id: orderId,
    status: "placed",
    title: "Payment received",
    note: "Your payment was successful and your order is confirmed.",
  })

  if (order.coupon_code) {
    await db
      .update(coupons)
      .set({ times_used: sql`${coupons.times_used} + 1` })
      .where(eq(coupons.code, order.coupon_code))
  }

  // Decrement stock now that money has been captured.
  const items = Array.isArray(order.items) ? (order.items as { slug: string; quantity: number }[]) : []
  const demand = new Map<string, number>()
  for (const item of items) {
    demand.set(item.slug, (demand.get(item.slug) ?? 0) + item.quantity)
  }
  await Promise.all(
    [...demand.entries()].map(([slug, qty]) =>
      db
        .update(products)
        .set({ stock: sql`GREATEST(0, ${products.stock} - ${qty})` })
        .where(eq(products.slug, slug)),
    ),
  )

  revalidatePath("/orders")
  revalidatePath("/shop")
  return { order_number: order.order_number, status: "paid" as const }
}
