import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAddresses } from "@/lib/account.actions"
import { confirmStripeCheckout } from "@/lib/stripe.actions"
import { getSession } from "@/lib/session"
import { getPublishableKey } from "@/lib/stripe"
import { CheckoutForm } from "@/components/checkout-form"
import { CheckoutResult } from "@/components/checkout-result"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  if (!session?.user) redirect("/auth?redirect=/checkout")

  // Stripe sends the shopper back here with a session_id. The payment is
  // verified server-to-Stripe before anything is marked paid.
  if (params.session_id) {
    const outcome = await confirmStripeCheckout({ session_id: params.session_id }).catch(() => null)
    return <CheckoutResult outcome={outcome} />
  }

  const addresses = await getAddresses()
  const publishableKey = getPublishableKey()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-10">
        <p className="text-eyebrow text-muted-foreground">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl">Almost yours</h1>
      </header>

      <CheckoutForm
        email={session.user.email}
        defaultName={session.user.name ?? ""}
        address={addresses[0] ?? null}
        // Card/UPI only appear when Stripe is actually configured, so the form
        // can never offer a payment path that would fail server-side.
        onlinePaymentEnabled={Boolean(process.env.STRIPE_SECRET_KEY && publishableKey)}
        publishableKey={publishableKey}
      />
    </div>
  )
}
