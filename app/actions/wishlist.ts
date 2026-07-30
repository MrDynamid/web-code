'use server'

import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { products, wishlist, type Product } from '@/lib/db/schema'
import { getSession, getSessionUserId } from '@/lib/admin-auth'

/** Returns the set of product ids the current user has wishlisted. */
export async function getWishlistIds(): Promise<number[]> {
  const session = await getSession()
  if (!session?.user) return []
  const rows = await db
    .select({ productId: wishlist.productId })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
  return rows.map((r) => r.productId)
}

/** Returns full product records for the current user's wishlist. */
export async function getWishlistProducts(): Promise<Product[]> {
  const session = await getSession()
  if (!session?.user) return []
  const rows = await db
    .select({ productId: wishlist.productId, createdAt: wishlist.createdAt })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
    .orderBy(desc(wishlist.createdAt))
  const ids = rows.map((r) => r.productId)
  if (ids.length === 0) return []
  const items = await db.select().from(products).where(inArray(products.id, ids))
  // Preserve wishlist order (most recently added first).
  const order = new Map(ids.map((id, i) => [id, i]))
  return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

/**
 * Adds or removes a product from the current user's wishlist. Returns the new
 * state so the client can update its UI.
 */
export async function toggleWishlist(
  productId: number,
): Promise<{ ok: true; wishlisted: boolean } | { ok: false; error: string }> {
  let userId: string
  try {
    userId = await getSessionUserId()
  } catch {
    return { ok: false, error: 'Please sign in to save items to your wishlist.' }
  }

  const existing = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
    revalidatePath('/wishlist')
    return { ok: true, wishlisted: false }
  }

  await db.insert(wishlist).values({ userId, productId })
  revalidatePath('/wishlist')
  return { ok: true, wishlisted: true }
}
