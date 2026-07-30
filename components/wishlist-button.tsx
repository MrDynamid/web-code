'use client'

import { useState, useTransition } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleWishlist } from '@/app/actions/wishlist'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function WishlistButton({
  productId,
  initialWishlisted = false,
  variant = 'overlay',
  onRemoved,
}: {
  productId: number
  initialWishlisted?: boolean
  variant?: 'overlay' | 'inline'
  onRemoved?: () => void
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [pending, startTransition] = useTransition()

  function handleToggle(e: React.MouseEvent) {
    // Product cards wrap the button in a Link — don't navigate on click.
    e.preventDefault()
    e.stopPropagation()
    if (pending) return

    startTransition(async () => {
      const result = await toggleWishlist(productId)
      if (!result.ok) {
        toast.error(result.error, {
          action: {
            label: 'Sign in',
            onClick: () => {
              window.location.href = '/login?redirect=/wishlist'
            },
          },
        })
        return
      }
      setWishlisted(result.wishlisted)
      toast.success(result.wishlisted ? 'Saved to wishlist' : 'Removed from wishlist')
      if (!result.wishlisted) onRemoved?.()
    })
  }

  if (variant === 'inline') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        disabled={pending}
        className="h-12 gap-2"
        aria-pressed={wishlisted}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart
            className={cn('size-4', wishlisted && 'fill-gold text-gold')}
            strokeWidth={1.5}
          />
        )}
        {wishlisted ? 'Saved' : 'Add to wishlist'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={wishlisted}
      className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart
          className={cn('size-4', wishlisted && 'fill-gold text-gold')}
          strokeWidth={1.5}
        />
      )}
    </button>
  )
}
