import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners, type Banner } from '@/lib/db/schema'

export type { Banner }

/** Active banners for the storefront, ordered by position. */
export async function getActiveBanners(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .where(eq(banners.active, true))
    .orderBy(asc(banners.position), asc(banners.id))
}

/** All banners for the admin dashboard, ordered by position. */
export async function getAllBanners(): Promise<Banner[]> {
  return db.select().from(banners).orderBy(asc(banners.position), asc(banners.id))
}

export async function getBannerById(id: number): Promise<Banner | null> {
  const rows = await db.select().from(banners).where(eq(banners.id, id)).limit(1)
  return rows[0] ?? null
}
