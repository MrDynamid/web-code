"use server"

import { z } from "zod"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { reviewVotes, reviews } from "@/db/schema"
import { getUserId, requireUserId } from "@/lib/session"

/** Marks a review helpful, or removes the vote if it already exists. */
export async function toggleReviewHelpful(input: { review_id: string }) {
  const userId = await requireUserId()
  const data = z.object({ review_id: z.string().uuid() }).parse(input)

  const [existing] = await db
    .select({ id: reviewVotes.id })
    .from(reviewVotes)
    .where(and(eq(reviewVotes.review_id, data.review_id), eq(reviewVotes.user_id, userId)))
    .limit(1)

  if (existing) {
    await db.delete(reviewVotes).where(eq(reviewVotes.id, existing.id))
    await syncHelpfulCount(data.review_id)
    return { voted: false as const }
  }

  await db
    .insert(reviewVotes)
    .values({ review_id: data.review_id, user_id: userId })
    .onConflictDoNothing({ target: [reviewVotes.review_id, reviewVotes.user_id] })

  await syncHelpfulCount(data.review_id)
  return { voted: true as const }
}

/**
 * Keeps reviews.helpful_count in step with the vote table. Derived from a COUNT
 * rather than incremented, so it can't drift out of sync.
 */
async function syncHelpfulCount(reviewId: string) {
  const [agg] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(reviewVotes)
    .where(eq(reviewVotes.review_id, reviewId))

  await db
    .update(reviews)
    .set({ helpful_count: Number(agg?.count ?? 0) })
    .where(eq(reviews.id, reviewId))
}

/** Review ids the signed-in shopper has already marked helpful. */
export async function getMyReviewVotes() {
  const userId = await getUserId()
  if (!userId) return { reviewIds: [] as string[] }

  const rows = await db
    .select({ review_id: reviewVotes.review_id })
    .from(reviewVotes)
    .where(eq(reviewVotes.user_id, userId))

  return { reviewIds: rows.map((row) => row.review_id) }
}
