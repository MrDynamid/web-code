"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { coupons, newsletterSubscribers, newsletterThrottle } from "@/db/schema"

const couponSchema = z.object({
  code: z.string().min(2).max(40),
  subtotal: z.number().int().min(0),
})

/**
 * Validates a promo code against the live coupon table. The discount is always
 * recomputed here from server-side values — never trust a total sent by the
 * browser, or a shopper could mint their own discount.
 */
export async function validateCoupon(input: z.infer<typeof couponSchema>) {
  const data = couponSchema.parse(input)

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, data.code.trim().toUpperCase()), eq(coupons.active, true)))
    .limit(1)

  if (!coupon) return { ok: false as const, message: "That code isn't valid." }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { ok: false as const, message: `${coupon.code} has expired.` }
  }

  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
    return { ok: false as const, message: `${coupon.code} has reached its limit.` }
  }

  if (data.subtotal < coupon.min_order) {
    return {
      ok: false as const,
      message: `Add ₹${(coupon.min_order - data.subtotal).toLocaleString("en-IN")} more to use ${coupon.code}.`,
    }
  }

  const discount =
    coupon.type === "percentage"
      ? Math.round((data.subtotal * coupon.value) / 100)
      : Math.min(coupon.value, data.subtotal)

  return { ok: true as const, code: coupon.code, label: coupon.label, discount }
}

const newsletterSchema = z.object({ email: z.string().email().max(255) })

/**
 * Newsletter sign-up, rate-limited to 5 attempts per client per hour so the
 * form can't be used to hammer the table.
 */
export async function subscribeNewsletter(input: z.infer<typeof newsletterSchema>) {
  const data = newsletterSchema.parse(input)

  const headerList = await headers()
  const clientKey =
    headerList.get("cf-connecting-ip") ??
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"

  const windowMs = 60 * 60 * 1000
  const now = Date.now()

  const [row] = await db
    .select()
    .from(newsletterThrottle)
    .where(eq(newsletterThrottle.client_key, clientKey))
    .limit(1)

  const fresh = !row || now - new Date(row.window_start).getTime() > windowMs
  const hits = fresh ? 1 : row.hits + 1

  if (hits > 5) {
    return { ok: false as const, message: "Too many sign-ups. Please try again later." }
  }

  const windowStart = fresh ? new Date(now).toISOString() : row!.window_start

  await db
    .insert(newsletterThrottle)
    .values({ client_key: clientKey, hits, window_start: windowStart })
    .onConflictDoUpdate({
      target: newsletterThrottle.client_key,
      set: { hits, window_start: windowStart },
    })

  await db
    .insert(newsletterSubscribers)
    .values({ email: data.email.toLowerCase() })
    .onConflictDoNothing({ target: newsletterSubscribers.email })

  return { ok: true as const }
}
