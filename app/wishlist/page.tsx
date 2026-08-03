import type { Metadata } from "next"
import Link from "next/link"
import { Heart } from "lucide-react"
import { getWishlist } from "@/lib/account.actions"
import { getSession } from "@/lib/session"
import { ProductCard } from "@/components/product-card"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The pieces you've saved for later.",
}

export default async function WishlistPage() {
  const session = await getSession()

  if (!session?.user) {
    return (
      <EmptyState
        title="Sign in to see your wishlist"
        copy="Your saved pieces follow you across devices once you're signed in."
        actionHref="/auth?redirect=/wishlist"
        actionLabel="Sign in"
      />
    )
  }

  const saved = await getWishlist()
  const products = saved.map((row) => row.products).filter((product) => product !== null)

  if (products.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        copy="Tap the heart on any piece to keep it here while you decide."
        actionHref="/shop"
        actionLabel="Browse the collection"
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-eyebrow text-muted-foreground">Saved for later</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your wishlist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "piece" : "pieces"} saved
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>
    </div>
  )
}

function EmptyState({
  title,
  copy,
  actionHref,
  actionLabel,
}: {
  title: string
  copy: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <Heart width={32} height={32} strokeWidth={1.2} className="text-primary" />
      <h1 className="mt-5 font-display text-3xl text-balance">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
      <Link
        href={actionHref}
        className="mt-7 rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
