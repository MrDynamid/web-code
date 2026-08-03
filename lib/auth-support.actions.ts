"use server"

import { z } from "zod"
import { isEmailConfigured, readDevResetLink } from "@/lib/mail"

/**
 * Tells the forgot-password screen whether a real email provider is wired up.
 * Without RESEND_API_KEY the reset link can't be delivered, so the UI offers the
 * dev fallback link instead of claiming an email was sent.
 */
export async function getEmailDeliveryStatus() {
  return { configured: isEmailConfigured() }
}

/**
 * Dev-only escape hatch: hands back the most recent reset link for an address so
 * the flow can be completed without an inbox. `readDevResetLink` returns null in
 * production, so this can never leak a live token.
 */
export async function getDevResetLink(input: { email: string }) {
  const data = z.object({ email: z.string().email().max(255) }).parse(input)
  return { url: readDevResetLink(data.email) }
}
