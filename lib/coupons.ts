import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { coupons, type Coupon } from '@/lib/db/schema'

export type { Coupon }

export async function getAllCoupons(): Promise<Coupon[]> {
  return db.select().from(coupons).orderBy(asc(coupons.createdAt), asc(coupons.code))
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1)

  return rows[0] ?? null
}

export async function getActiveCouponByCode(code: string): Promise<Coupon | null> {
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1)

  const coupon = rows[0]
  return coupon && coupon.active ? coupon : null
}
