"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Star, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import type { Review } from "@/lib/catalog"
import { formatDate } from "@/lib/format"
import { submitReview } from "@/lib/account.actions"
import { toggleReviewHelpful } from "@/lib/reviews.actions"
import { StarRating } from "@/components/star-rating"
import { SmartImage } from "@/components/smart-image"
import { cn } from "@/lib/utils"

export function ProductReviews({
  slug,
  reviews,
  votedIds,
  isAuthenticated,
  authorName,
}: {
  slug: string
  reviews: Review[]
  votedIds: string[]
  isAuthenticated: boolean
  authorName: string
}) {
  const [voted, setVoted] = useState<string[]>(votedIds)
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(reviews.map((review) => [review.id, review.helpful_count])),
  )
  const [formOpen, setFormOpen] = useState(false)

  function vote(id: string) {
    if (!isAuthenticated) {
      toast.error("Sign in to mark reviews helpful")
      return
    }
    const wasVoted = voted.includes(id)
    // Optimistic flip, reconciled from the action's answer.
    setVoted((current) => (wasVoted ? current.filter((value) => value !== id) : [...current, id]))
    setCounts((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + (wasVoted ? -1 : 1)) }))
    void toggleReviewHelpful({ review_id: id })
      .then((result) => {
        setVoted((current) =>
          result.voted ? [...new Set([...current, id])] : current.filter((value) => value !== id),
        )
      })
      .catch(() => {
        setVoted((current) => (wasVoted ? [...new Set([...current, id])] : current.filter((v) => v !== id)))
        setCounts((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + (wasVoted ? 1 : -1)) }))
        toast.error("Couldn't record that vote.")
      })
  }

  return (
    <section aria-labelledby="reviews-heading" className="border-t pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-muted-foreground">Reviews</p>
          <h2 id="reviews-heading" className="mt-2 font-display text-3xl">
            What our clients say
          </h2>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="rounded-md border px-5 py-2.5 text-xs tracking-[0.16em] uppercase transition-colors hover:border-primary hover:text-primary"
          >
            {formOpen ? "Cancel" : "Write a review"}
          </button>
        ) : (
          <Link href="/auth" className="link-underline text-sm text-primary">
            Sign in to write a review
          </Link>
        )}
      </div>

      {formOpen ? <ReviewForm slug={slug} authorName={authorName} onDone={() => setFormOpen(false)} /> : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No reviews yet — be the first to share how this piece fits.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} size={13} />
                    {review.verified ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
                        Verified buyer
                      </span>
                    ) : null}
                  </div>
                  {review.title ? <h3 className="mt-2 font-display text-lg">{review.title}</h3> : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>

              {review.image_url ? (
                <SmartImage
                  src={review.image_url}
                  alt={`Photo from ${review.author_name}'s review`}
                  width={320}
                  height={320}
                  loading="lazy"
                  decoding="async"
                  className="mt-4 h-28 w-28 rounded-md object-cover"
                />
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-xs text-muted-foreground">{review.author_name}</span>
                <button
                  type="button"
                  onClick={() => vote(review.id)}
                  aria-pressed={voted.includes(review.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    voted.includes(review.id) ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ThumbsUp width={13} height={13} strokeWidth={1.6} />
                  Helpful{counts[review.id] ? ` (${counts[review.id]})` : ""}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ReviewForm({ slug, authorName, onDone }: { slug: string; authorName: string; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="mt-6 grid gap-4 rounded-lg border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        startTransition(async () => {
          try {
            await submitReview({
              product_slug: slug,
              rating,
              title: String(form.get("title") ?? ""),
              body: String(form.get("body") ?? ""),
              author_name: String(form.get("author_name") ?? "").trim() || "MEHR client",
            })
            toast.success("Thank you — your review is live.")
            onDone()
          } catch {
            toast.error("Couldn't post that review. Please check the fields and retry.")
          }
        })
      }}
    >
      <fieldset>
        <legend className="text-eyebrow text-muted-foreground">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={rating === value}
            >
              <Star
                width={22}
                height={22}
                strokeWidth={1.5}
                className={cn(
                  "transition-colors",
                  value <= rating ? "fill-gold text-gold" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-eyebrow text-muted-foreground">Your name</span>
          <input
            name="author_name"
            defaultValue={authorName}
            required
            minLength={2}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="text-eyebrow text-muted-foreground">Headline</span>
          <input
            name="title"
            placeholder="Optional"
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-primary"
          />
        </label>
      </div>

      <label className="text-sm">
        <span className="text-eyebrow text-muted-foreground">Your review</span>
        <textarea
          name="body"
          required
          minLength={4}
          rows={4}
          placeholder="How does it fit? How is the fabric?"
          className="mt-2 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-md bg-primary px-6 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post review"}
      </button>
    </form>
  )
}
