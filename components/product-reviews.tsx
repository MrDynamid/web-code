'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Star } from 'lucide-react'
import type { Review } from '@/lib/db/schema'
import { addReview, type ReviewActionState } from '@/app/actions/reviews'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'size-4',
            n <= Math.round(value)
              ? 'fill-gold text-gold'
              : 'fill-transparent text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className="rounded p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            className={cn(
              'size-6',
              n <= (hover || value)
                ? 'fill-gold text-gold'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  reviewCount,
  isSignedIn,
}: {
  productId: number
  reviews: Review[]
  averageRating: number
  reviewCount: number
  isSignedIn: boolean
}) {
  const router = useRouter()
  const [rating, setRating] = useState(5)

  const [, formAction, pending] = useActionState(
    async (prev: ReviewActionState, formData: FormData) => {
      formData.set('rating', String(rating))
      const result = await addReview(prev, formData)
      if (result?.success) {
        toast.success('Thanks for your review!')
        router.refresh()
      } else if (result?.error) {
        toast.error(result.error)
      }
      return result
    },
    null,
  )

  return (
    <section className="mt-16 border-t border-border pt-12" id="reviews">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="text-xl tracking-[0.04em]">Customer Reviews</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl font-light">{averageRating.toFixed(1)}</span>
            <div className="grid gap-1">
              <Stars value={averageRating} />
              <span className="text-xs text-muted-foreground">
                Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="mt-8">
            {isSignedIn ? (
              <form action={formAction} className="grid gap-4">
                <input type="hidden" name="productId" value={productId} />
                <div className="grid gap-2">
                  <Label>Your rating</Label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="review-title">Title (optional)</Label>
                  <Input id="review-title" name="title" placeholder="Summarise your experience" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="review-body">Review</Label>
                  <Textarea
                    id="review-body"
                    name="body"
                    rows={4}
                    required
                    placeholder="What did you think of the fit, fabric and quality?"
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-fit gap-2">
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Submit review
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground">
                <Link href="/login" className="font-medium text-foreground underline">
                  Sign in
                </Link>{' '}
                to write a review and share your experience.
              </div>
            )}
          </div>
        </div>

        <div>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to review this piece.
            </p>
          ) : (
            <ul className="grid gap-6">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                        {review.userName.slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{review.userName}</p>
                        <Stars value={review.rating} />
                      </div>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  {review.title && (
                    <p className="mt-3 text-sm font-medium">{review.title}</p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {review.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
