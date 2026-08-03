"use client";

import { useCallback, useMemo } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

// Cache the Stripe.js loader promise per publishable key so we don't reload it
// on every render. The publishable key is safe to expose to the browser.
const cache = new Map<string, Promise<Stripe | null>>();
function getStripe(publishableKey: string) {
  if (!cache.has(publishableKey)) cache.set(publishableKey, loadStripe(publishableKey));
  return cache.get(publishableKey)!;
}

/**
 * Renders Stripe's Embedded Checkout using a client_secret + publishable key
 * fetched from our server function. `fetchClientSecret` is called by Stripe to
 * hydrate the session — we hand back the secret we already created server-side.
 */
export function StripeCheckout({
  clientSecret,
  publishableKey,
}: {
  clientSecret: string;
  publishableKey: string;
}) {
  const stripePromise = useMemo(
    () => (publishableKey ? getStripe(publishableKey) : null),
    [publishableKey],
  );
  const fetchClientSecret = useCallback(async () => clientSecret, [clientSecret]);

  if (!stripePromise) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Payments are not configured. Please try again later.
      </p>
    );
  }

  return (
    <div id="stripe-embedded-checkout" className="rounded-lg border border-border bg-card p-1">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
