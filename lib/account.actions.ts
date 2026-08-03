"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  addresses,
  coupons,
  orderEvents,
  orders,
  paymentTransactions,
  products,
  profiles,
  reviews,
  wishlist,
} from "@/db/schema"
import { requireUser, requireUserId } from "@/lib/session"

/**
 * Only the identity of a line (slug/size/color/quantity) is trusted from the
 * client. `name`, `image` and `price` are optional display hints — `placeOrder`
 * re-reads all three from the live catalogue, so accepting them as required
 * would just invite a caller to think the price it sends matters.
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

/** Human-readable, collision-resistant order number. */
function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MH-${stamp}-${rand}`
}

/* ---------------------------------- wishlist ------------------------------ */

export async function getWishlist() {
  const userId = await requireUserId()
  return db
    .select({
      product_slug: wishlist.product_slug,
      created_at: wishlist.created_at,
      products: products,
    })
    .from(wishlist)
    .leftJoin(products, eq(products.slug, wishlist.product_slug))
    .where(eq(wishlist.user_id, userId))
    .orderBy(desc(wishlist.created_at))
}

export async function getWishlistSlugs() {
  const userId = await getSafeUserId()
  if (!userId) return []
  const rows = await db
    .select({ product_slug: wishlist.product_slug })
    .from(wishlist)
    .where(eq(wishlist.user_id, userId))
  return rows.map((row) => row.product_slug)
}

/** Non-throwing variant so public pages can render a signed-out wishlist state. */
async function getSafeUserId() {
  try {
    return await requireUserId()
  } catch {
    return null
  }
}

export async function toggleWishlist(input: { slug: string }) {
  const userId = await requireUserId()
  const data = z.object({ slug: z.string().min(1).max(120) }).parse(input)

  const [existing] = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(and(eq(wishlist.product_slug, data.slug), eq(wishlist.user_id, userId)))
    .limit(1)

  if (existing) {
    await db.delete(wishlist).where(eq(wishlist.id, existing.id))
    revalidatePath("/wishlist")
    return { saved: false }
  }

  await db
    .insert(wishlist)
    .values({ product_slug: data.slug, user_id: userId })
    .onConflictDoNothing({ target: [wishlist.user_id, wishlist.product_slug] })
  revalidatePath("/wishlist")
  return { saved: true }
}

/* ----------------------------------- orders ------------------------------- */

const placeOrderSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(6).max(20),
  line1: z.string().min(4).max(200),
  line2: z.string().max(200).optional().default(""),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().min(4).max(10),
  coupon_code: z.string().max(40).optional().default(""),
  // Only Cash on Delivery reaches this path — every online payment goes
  // through real Stripe checkout instead.
  payment_method: z.literal("cod"),
  payment_channel: z.string().max(60).optional().default(""),
  save_address: z.boolean().optional().default(true),
  items: z.array(cartItemSchema).min(1).max(40),
})

export async function placeOrder(input: z.input<typeof placeOrderSchema>) {
  const userId = await requireUserId()
  const data = placeOrderSchema.parse(input)

  // Re-price server side against the live catalogue; never trust client prices.
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

  // Collapse duplicate lines so quantity caps apply to the aggregate, not per row.
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

  // Block the order before taking money when something sold out meanwhile.
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
      payment_method: data.payment_method,
      payment_status: "pending", // COD is collected on delivery
      status: "placed",
      status_history: [{ status: "placed", at: new Date().toISOString() }],
    })
    .returning({
      id: orders.id,
      order_number: orders.order_number,
      total: orders.total,
      payment_method: orders.payment_method,
      payment_status: orders.payment_status,
    })

  // Record the payment attempt so every order has an auditable transaction row.
  await db.insert(paymentTransactions).values({
    order_id: order.id,
    user_id: userId,
    method: data.payment_method,
    channel: data.payment_channel || null,
    amount: total,
    status: "pending", // captured in cash at delivery
  })

  await db.insert(orderEvents).values({
    order_id: order.id,
    status: "placed",
    title: "Order placed",
    note: "We've received your order and are getting it ready.",
  })

  if (couponCode) {
    await db
      .update(coupons)
      .set({ times_used: sql`${coupons.times_used} + 1` })
      .where(eq(coupons.code, couponCode))
  }

  // Keep the shipping address on file so the next checkout is one tap.
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

  // Decrement stock atomically — customers cannot otherwise write to products.
  await Promise.all(
    [...demandBySlug.entries()].map(([slug, qty]) =>
      db
        .update(products)
        .set({ stock: sql`GREATEST(0, ${products.stock} - ${qty})` })
        .where(eq(products.slug, slug)),
    ),
  )

  revalidatePath("/orders")
  revalidatePath("/shop")
  return order
}

export async function getAddresses() {
  const userId = await requireUserId()
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.user_id, userId))
    .orderBy(desc(addresses.is_default), desc(addresses.created_at))
}

export async function getOrders() {
  const userId = await requireUserId()
  return db.select().from(orders).where(eq(orders.user_id, userId)).orderBy(desc(orders.created_at))
}

export async function getOrderTracking(input: { id: string }) {
  const userId = await requireUserId()
  const data = z.object({ id: z.string().uuid() }).parse(input)

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, data.id), eq(orders.user_id, userId)))
    .limit(1)

  if (!order) throw new Error("Order not found.")

  const [events, payments] = await Promise.all([
    db.select().from(orderEvents).where(eq(orderEvents.order_id, data.id)).orderBy(orderEvents.created_at),
    db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.order_id, data.id))
      .orderBy(desc(paymentTransactions.created_at)),
  ])

  return { order, events, payments }
}

export async function cancelOrder(input: { id: string }) {
  const userId = await requireUserId()
  const data = z.object({ id: z.string().uuid() }).parse(input)

  const [current] = await db
    .select({ status: orders.status, status_history: orders.status_history })
    .from(orders)
    .where(and(eq(orders.id, data.id), eq(orders.user_id, userId)))
    .limit(1)

  if (!current) throw new Error("We couldn't find that order.")
  if (!["placed", "confirmed"].includes(current.status)) {
    throw new Error(
      current.status === "cancelled"
        ? "This order is already cancelled."
        : "This order has already shipped, so it can't be cancelled. Please use returns instead.",
    )
  }

  const history = Array.isArray(current.status_history) ? current.status_history : []
  await db
    .update(orders)
    .set({
      status: "cancelled",
      status_history: [...history, { status: "cancelled", at: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    })
    .where(
      and(
        eq(orders.id, data.id),
        eq(orders.user_id, userId),
        inArray(orders.status, ["placed", "confirmed"]),
      ),
    )

  await db.insert(orderEvents).values({
    order_id: data.id,
    status: "cancelled",
    title: "Order cancelled",
    note: "You cancelled this order.",
  })

  revalidatePath("/orders")
  return { ok: true }
}

/* ---------------------------------- reviews ------------------------------- */

const reviewSchema = z.object({
  product_slug: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(""),
  body: z.string().min(4).max(1500),
  author_name: z.string().min(2).max(80),
  image_path: z.string().max(500).optional(),
})

export async function submitReview(input: z.input<typeof reviewSchema>) {
  const userId = await requireUserId()
  const data = reviewSchema.parse(input)

  // Only mark "verified" when this shopper actually bought the product.
  const purchased = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.user_id, userId), sql`${orders.items}::text ILIKE ${`%"${data.product_slug}"%`}`))
    .limit(1)

  await db.insert(reviews).values({
    product_slug: data.product_slug,
    user_id: userId,
    rating: data.rating,
    title: data.title || null,
    body: data.body,
    author_name: data.author_name,
    verified: purchased.length > 0,
    // image_path is a public Vercel Blob URL uploaded from the review form.
    image_url: data.image_path || null,
  })

  await refreshProductRating(data.product_slug)
  revalidatePath(`/product/${data.product_slug}`)
  return { ok: true }
}

/** Recomputes the cached rating + review count shown on cards and listings. */
async function refreshProductRating(slug: string) {
  const [agg] = await db
    .select({
      avg: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.product_slug, slug), eq(reviews.approved, true)))

  await db
    .update(products)
    .set({ rating: Number(agg?.avg ?? 0), review_count: Number(agg?.count ?? 0) })
    .where(eq(products.slug, slug))
}

/* ---------------------------------- profile ------------------------------- */

export async function getProfile() {
  const user = await requireUser()
  const userId = user.id

  const [[profile], [address], orderRows] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db
      .select()
      .from(addresses)
      .where(eq(addresses.user_id, userId))
      .orderBy(desc(addresses.created_at))
      .limit(1),
    db.select({ id: orders.id }).from(orders).where(eq(orders.user_id, userId)),
  ])

  return {
    profile: profile ?? {
      id: userId,
      full_name: user.name ?? null,
      avatar_url: null,
      phone: null,
    },
    address: address ?? null,
    orderCount: orderRows.length,
  }
}

export async function saveProfile(input: { full_name: string; phone?: string }) {
  const userId = await requireUserId()
  const data = z
    .object({ full_name: z.string().min(2).max(120), phone: z.string().max(20).optional().default("") })
    .parse(input)

  await db
    .insert(profiles)
    .values({ id: userId, full_name: data.full_name, phone: data.phone || null })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      },
    })

  revalidatePath("/account")
  return { ok: true }
}
