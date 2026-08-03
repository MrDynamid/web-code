"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CircleAlert, PartyPopper } from "lucide-react"
import { useCart } from "@/lib/cart"

type Outcome = { order_number: string; status: "paid" | "unpaid" } | null

/**
 * Shown when Stripe redirects back to /checkout. The bag is only emptied once
 * the server has confirmed the payment actually settled.
 */
export function CheckoutResult({ outcome }: { outcome: Outcome }) {
  const { clear } = useCart()
  const paid = outcome?.status === "paid"

  useEffect(() => {
    if (paid) clear()
  }, [paid, clear])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      {paid ? (
        <PartyPopper width={32} height={32} strokeWidth={1.2} className="text-primary" />
      ) : (
        <CircleAlert width={32} height={32} strokeWidth={1.2} className="text-destructive" />
      )}

      <h1 className="mt-5 font-display text-3xl text-balance">
        {paid ? "Thank you — your order is confirmed" : "We couldn't confirm that payment"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {paid
          ? `Order ${outcome!.order_number} is being packed. You'll get tracking details by email as soon as it ships.`
          : "Your card wasn't charged, or the payment is still processing. Your bag has been kept exactly as it was."}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/orders"
          className="rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
        >
          View orders
        </Link>
        <Link
          href={paid ? "/shop" : "/checkout"}
          className="rounded-md border px-7 py-3 text-xs tracking-[0.18em] uppercase transition-colors hover:border-primary hover:text-primary"
        >
          {paid ? "Keep shopping" : "Try again"}
        </Link>
      </div>
    </div>
  )
}
