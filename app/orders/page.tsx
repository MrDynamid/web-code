import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package } from "lucide-react"
import { getOrders } from "@/lib/account.actions"
import { getSession } from "@/lib/session"
import { OrdersList } from "@/components/orders-list"

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  if (!session?.user) redirect("/auth?redirect=/orders")

  const orders = await getOrders()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-eyebrow text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Orders</h1>
      </header>

      {orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center">
          <Package width={30} height={30} strokeWidth={1.2} className="text-primary" />
          <h2 className="mt-4 font-display text-2xl">No orders yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            When you place an order it&apos;ll appear here with live tracking from dispatch to doorstep.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <OrdersList orders={orders} highlight={params.highlight} />
        </div>
      )}
    </div>
  )
}
