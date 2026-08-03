"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { and, asc, desc, eq, gte } from "drizzle-orm"
import { db } from "@/db"
import {
  banners,
  categories,
  coupons,
  newsletterSubscribers,
  orders,
  products,
  reviews,
  userRoles,
} from "@/db/schema"
import { requireUserId } from "@/lib/session"

/* -------------------------------------------------------------------------- */
/* Admin role helpers. Roles live in `user_roles`; Neon has no RLS, so every   */
/* mutating action calls assertAdmin() before touching a row.                  */
/* -------------------------------------------------------------------------- */

async function isAdminUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.user_id, userId), eq(userRoles.role, "admin")))
    .limit(1)
  return Boolean(row)
}

async function adminExists(): Promise<boolean> {
  const [row] = await db.select({ id: userRoles.id }).from(userRoles).where(eq(userRoles.role, "admin")).limit(1)
  return Boolean(row)
}

/** Returns the caller's id once admin access is confirmed, else throws. */
async function assertAdmin(): Promise<string> {
  const userId = await requireUserId()
  if (!(await isAdminUser(userId))) throw new Error("Forbidden: admin access required.")
  return userId
}

export async function getAdminAccess() {
  try {
    const userId = await requireUserId()
    const [admin, exists] = await Promise.all([isAdminUser(userId), adminExists()])
    return { isAdmin: admin, adminExists: exists }
  } catch {
    return { isAdmin: false, adminExists: true }
  }
}

/** One-time owner bootstrap — refuses once any admin exists. */
export async function claimFirstAdmin() {
  const userId = await requireUserId()
  if (await adminExists()) throw new Error("An owner already exists for this store.")
  await db
    .insert(userRoles)
    .values({ user_id: userId, role: "admin" })
    .onConflictDoNothing({ target: [userRoles.user_id, userRoles.role] })
  revalidatePath("/admin")
  return { ok: true }
}

export async function getAdminData() {
  await assertAdmin()

  const [productRows, categoryRows, bannerRows, couponRows, orderRows, reviewRows, subscriberRows] =
    await Promise.all([
      db.select().from(products).orderBy(desc(products.created_at)),
      db.select().from(categories).orderBy(asc(categories.position)),
      db.select().from(banners).orderBy(asc(banners.position)),
      db.select().from(coupons).orderBy(desc(coupons.created_at)),
      db.select().from(orders).orderBy(desc(orders.created_at)).limit(200),
      db.select().from(reviews).orderBy(desc(reviews.created_at)).limit(200),
      db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.created_at)).limit(200),
    ])

  const revenue = orderRows
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.total ?? 0), 0)

  return {
    products: productRows,
    categories: categoryRows,
    banners: bannerRows,
    coupons: couponRows,
    orders: orderRows,
    reviews: reviewRows,
    subscribers: subscriberRows,
    stats: {
      revenue,
      orderCount: orderRows.length,
      pending: orderRows.filter((order) => order.status === "placed").length,
      products: productRows.length,
      lowStock: productRows.filter((product) => product.stock <= 5).length,
      subscribers: subscriberRows.length,
    },
  }
}

/** Every admin write touches the storefront, so refresh the public caches too. */
function revalidateStorefront() {
  revalidatePath("/")
  revalidatePath("/shop")
  revalidatePath("/admin")
}

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  name: z.string().min(2).max(200),
  description: z.string().max(4000).default(""),
  details: z.string().max(2000).optional().default(""),
  fabric: z.string().max(200).optional().default(""),
  care: z.string().max(500).optional().default(""),
  price: z.number().int().min(0).max(10_000_000),
  compare_at_price: z.number().int().min(0).max(10_000_000).nullable().optional(),
  category_slug: z.string().min(1).max(120),
  images: z.array(z.string().max(500)).max(8).default([]),
  colors: z.array(z.string().max(60)).max(12).default([]),
  sizes: z.array(z.string().max(40)).max(12).default([]),
  badge: z.string().max(40).nullable().optional(),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).max(100000).default(0),
})

export async function saveProduct(input: z.input<typeof productSchema>) {
  await assertAdmin()
  const data = productSchema.parse(input)
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description,
    details: data.details || null,
    fabric: data.fabric || null,
    care: data.care || null,
    category_slug: data.category_slug,
    price: data.price,
    compare_at_price: data.compare_at_price ?? null,
    images: data.images,
    colors: data.colors,
    sizes: data.sizes,
    badge: data.badge || null,
    featured: data.featured,
    stock: data.stock,
  }
  if (data.id) {
    await db.update(products).set(payload).where(eq(products.id, data.id))
  } else {
    await db.insert(products).values(payload)
  }
  revalidateStorefront()
  revalidatePath(`/product/${data.slug}`)
  return { ok: true }
}

export async function deleteProduct(input: { id: string }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid() }).parse(input)
  await db.delete(products).where(eq(products.id, data.id))
  revalidateStorefront()
  return { ok: true }
}

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  tagline: z.string().max(200).optional().default(""),
  image: z.string().max(500).optional().default(""),
  position: z.number().int().min(0).max(999).default(0),
})

export async function saveCategory(input: z.input<typeof categorySchema>) {
  await assertAdmin()
  const data = categorySchema.parse(input)
  const payload = {
    slug: data.slug,
    name: data.name,
    tagline: data.tagline || null,
    image: data.image || null,
    position: data.position,
  }
  if (data.id) {
    await db.update(categories).set(payload).where(eq(categories.id, data.id))
  } else {
    await db.insert(categories).values(payload)
  }
  revalidateStorefront()
  return { ok: true }
}

export async function deleteCategory(input: { id: string }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid() }).parse(input)
  await db.delete(categories).where(eq(categories.id, data.id))
  revalidateStorefront()
  return { ok: true }
}

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  eyebrow: z.string().max(80).optional().default(""),
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional().default(""),
  cta_label: z.string().max(60).optional().default(""),
  cta_href: z.string().max(300).optional().default(""),
  image: z.string().max(500).optional().default(""),
  placement: z.enum(["hero", "promo"]).default("hero"),
  active: z.boolean().default(true),
  position: z.number().int().min(0).max(999).default(0),
})

export async function saveBanner(input: z.input<typeof bannerSchema>) {
  await assertAdmin()
  const data = bannerSchema.parse(input)
  const payload = {
    eyebrow: data.eyebrow || null,
    title: data.title,
    subtitle: data.subtitle || null,
    cta_label: data.cta_label || null,
    cta_href: data.cta_href || null,
    image: data.image || null,
    placement: data.placement,
    active: data.active,
    position: data.position,
  }
  if (data.id) {
    await db.update(banners).set(payload).where(eq(banners.id, data.id))
  } else {
    await db.insert(banners).values(payload)
  }
  revalidateStorefront()
  return { ok: true }
}

export async function deleteBanner(input: { id: string }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid() }).parse(input)
  await db.delete(banners).where(eq(banners.id, data.id))
  revalidateStorefront()
  return { ok: true }
}

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(2)
    .max(40)
    .transform((value) => value.toUpperCase()),
  label: z.string().min(2).max(120),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(0).max(1_000_000),
  min_order: z.number().int().min(0).max(10_000_000).default(0),
  active: z.boolean().default(true),
})

export async function saveCoupon(input: z.input<typeof couponSchema>) {
  await assertAdmin()
  const data = couponSchema.parse(input)
  const payload = {
    code: data.code,
    label: data.label,
    type: data.type,
    value: data.value,
    min_order: data.min_order,
    active: data.active,
  }
  if (data.id) {
    await db.update(coupons).set(payload).where(eq(coupons.id, data.id))
  } else {
    await db.insert(coupons).values(payload)
  }
  revalidatePath("/admin")
  return { ok: true }
}

export async function deleteCoupon(input: { id: string }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid() }).parse(input)
  await db.delete(coupons).where(eq(coupons.id, data.id))
  revalidatePath("/admin")
  return { ok: true }
}

const orderUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]),
  payment_status: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
  tracking_number: z.string().max(80).optional().default(""),
  courier: z.string().max(80).optional().default(""),
})

export async function updateOrder(input: z.input<typeof orderUpdateSchema>) {
  await assertAdmin()
  const data = orderUpdateSchema.parse(input)

  const [existing] = await db
    .select({ status_history: orders.status_history })
    .from(orders)
    .where(eq(orders.id, data.id))
    .limit(1)
  const history = Array.isArray(existing?.status_history) ? existing.status_history : []

  await db
    .update(orders)
    .set({
      status: data.status,
      ...(data.payment_status ? { payment_status: data.payment_status } : {}),
      tracking_number: data.tracking_number || null,
      courier: data.courier || null,
      status_history: [...history, { status: data.status, at: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    })
    .where(eq(orders.id, data.id))

  revalidatePath("/admin")
  revalidatePath("/orders")
  return { ok: true }
}

export async function deleteOrder(input: { id: string }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid() }).parse(input)
  await db.delete(orders).where(eq(orders.id, data.id))
  revalidatePath("/admin")
  return { ok: true }
}

export async function moderateReview(input: { id: string; action: "approve" | "hide" | "delete" }) {
  await assertAdmin()
  const data = z.object({ id: z.string().uuid(), action: z.enum(["approve", "hide", "delete"]) }).parse(input)

  if (data.action === "delete") {
    await db.delete(reviews).where(eq(reviews.id, data.id))
  } else {
    await db
      .update(reviews)
      .set({ approved: data.action === "approve" })
      .where(eq(reviews.id, data.id))
  }
  revalidatePath("/admin")
  return { ok: true }
}

/** Rolls up the last 30 days for the admin overview charts. */
export async function getAdminAnalytics() {
  await assertAdmin()
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const orderRows = await db
    .select({
      total: orders.total,
      status: orders.status,
      payment_method: orders.payment_method,
      items: orders.items,
      created_at: orders.created_at,
      user_id: orders.user_id,
      city: orders.city,
    })
    .from(orders)
    .where(gte(orders.created_at, since.toISOString()))
    .orderBy(asc(orders.created_at))

  const rows = orderRows.filter((order) => order.status !== "cancelled")

  const byDay = new Map<string, { day: string; revenue: number; orders: number }>()
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().slice(0, 10)
    byDay.set(key, { day: key, revenue: 0, orders: 0 })
  }
  for (const order of rows) {
    const bucket = byDay.get(String(order.created_at).slice(0, 10))
    if (!bucket) continue
    bucket.revenue += order.total ?? 0
    bucket.orders += 1
  }

  const productTally = new Map<string, { name: string; units: number; revenue: number }>()
  for (const order of rows) {
    for (const item of (order.items ?? []) as Array<{
      slug: string
      name: string
      price?: number
      quantity?: number
    }>) {
      const entry = productTally.get(item.slug) ?? { name: item.name, units: 0, revenue: 0 }
      entry.units += item.quantity ?? 0
      entry.revenue += (item.price ?? 0) * (item.quantity ?? 0)
      productTally.set(item.slug, entry)
    }
  }

  const tally = (key: "status" | "payment_method" | "city", source: typeof orderRows) => {
    const map = new Map<string, number>()
    for (const order of source) {
      const value = String(order[key] ?? "unknown")
      map.set(value, (map.get(value) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }

  const revenue = rows.reduce((sum, order) => sum + (order.total ?? 0), 0)
  const customers = new Set(rows.map((order) => order.user_id))

  return {
    daily: [...byDay.values()],
    topProducts: [...productTally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    statusBreakdown: tally("status", orderRows),
    paymentMix: tally("payment_method", rows),
    topCities: tally("city", rows).slice(0, 6),
    totals: {
      revenue,
      orders: rows.length,
      customers: customers.size,
      aov: rows.length > 0 ? Math.round(revenue / rows.length) : 0,
    },
  }
}
