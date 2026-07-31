'use server'

import { revalidatePath } from 'next/cache'
import { and, desc, eq, sql } from 'drizzle-orm'
import { getSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { products, reviews, type Review } from '@/lib/db/schema'

export type ReviewActionState = { error?: string; success?: boolean } | null

export async function getReviews(productId: number): Promise<Review[]> {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
}

/** Recompute a product's aggregate rating + count from its reviews. */
async function syncProductRating(productId: number) {
  const [agg] = await db
    .select({
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))

  const count = Number(agg?.count ?? 0)
  // numeric columns round-trip as strings in Drizzle; keep one decimal place.
  const avg = count > 0 ? (Math.round(Number(agg?.avg ?? 0) * 10) / 10).toFixed(1) : '5.0'

  await db
    .update(products)
    .set({ rating: avg, reviewCount: count })
    .where(eq(products.id, productId))
}

export async function addReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Please sign in to leave a review.' }
  }

  const productId = Number(formData.get('productId'))
  const rating = Number(formData.get('rating'))
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!Number.isFinite(productId) || productId <= 0) {
    return { error: 'Invalid product.' }
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Please select a rating from 1 to 5 stars.' }
  }
  if (body.length < 3) {
    return { error: 'Please write a short review.' }
  }

  try {
    await db
      .insert(reviews)
      .values({
        productId,
        userId: session.user.id,
        userName: session.user.name || session.user.email.split('@')[0],
        rating,
        title: title || null,
        body,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.productId],
        set: { rating, title: title || null, body, createdAt: new Date() },
      })

    await syncProductRating(productId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit review.'
    return { error: message }
  }

  const product = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (product[0]) revalidatePath(`/products/${product[0].slug}`)
  return { success: true }
}

export async function deleteMyReview(productId: number): Promise<void> {
  const session = await getSession()
  if (!session?.user) return
  await db
    .delete(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, session.user.id)))
  await syncProductRating(productId)

  const product = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (product[0]) revalidatePath(`/products/${product[0].slug}`)
}
