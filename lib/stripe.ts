import Stripe from "stripe";

/**
 * Server-only Stripe client. The secret key never reaches the browser.
 * All money math (line items, totals, currency) is done here so the client
 * can only choose *which* products to buy, never the price.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  // Surface a clear message during dev instead of a cryptic Stripe error.
  console.warn("[v0] STRIPE_SECRET_KEY is not set — Stripe checkout will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Pin the SDK's bundled API version for stable behaviour across deploys.
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

/** Publishable key for the browser (Embedded Checkout needs it client-side). */
export function getPublishableKey() {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY ??
    ""
  );
}
