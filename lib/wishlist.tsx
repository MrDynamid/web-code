"use client"

import { createContext, useCallback, useContext, useMemo, useOptimistic, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { toggleWishlist } from "@/lib/account.actions"

/**
 * Client-side mirror of the signed-in shopper's wishlist. The initial slugs are
 * read on the server (so the heart renders filled on first paint, no flash),
 * and every toggle goes through the `toggleWishlist` server action with an
 * optimistic local update. This replaces the react-query cache the Vite build
 * used, without adding a client data-fetching library.
 */
type WishlistContextValue = {
  slugs: string[]
  isSaved: (slug: string) => boolean
  toggle: (slug: string) => void
  pending: boolean
  isAuthenticated: boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({
  children,
  initialSlugs,
  isAuthenticated,
}: {
  children: ReactNode
  initialSlugs: string[]
  isAuthenticated: boolean
}) {
  const [slugs, setSlugs] = useState(initialSlugs)
  const [pending, setPending] = useState(false)
  const [optimisticSlugs, applyOptimistic] = useOptimistic(slugs, (current: string[], slug: string) =>
    current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
  )

  const toggle = useCallback(
    (slug: string) => {
      setPending(true)
      // Fire the optimistic flip inside a transition so React keeps it applied
      // until the action settles, then reconcile with the server's answer.
      void (async () => {
        applyOptimistic(slug)
        try {
          const result = await toggleWishlist({ slug })
          setSlugs((current) =>
            result.saved ? [...new Set([...current, slug])] : current.filter((value) => value !== slug),
          )
          toast.success(result.saved ? "Saved to your wishlist" : "Removed from wishlist")
        } catch {
          toast.error("Couldn't update your wishlist.")
        } finally {
          setPending(false)
        }
      })()
    },
    [applyOptimistic],
  )

  const value = useMemo<WishlistContextValue>(
    () => ({
      slugs: optimisticSlugs,
      isSaved: (slug: string) => optimisticSlugs.includes(slug),
      toggle,
      pending,
      isAuthenticated,
    }),
    [optimisticSlugs, toggle, pending, isAuthenticated],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used inside <WishlistProvider>")
  return context
}
