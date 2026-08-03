"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { and, desc, gte, inArray, lt } from "drizzle-orm"
import { db } from "@/db"
import { authAttempts } from "@/db/schema"

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5

const emailSchema = z.object({ email: z.string().email().max(255) })

async function clientIp() {
  const headerList = await headers()
  return (
    headerList.get("cf-connecting-ip") ??
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

function keysFor(email: string, ip: string) {
  return [`email:${email.trim().toLowerCase()}`, `ip:${ip}`]
}

/** Returns whether a sign-in attempt is allowed, and the cooldown left in seconds. */
export async function checkSignInAllowed(input: z.infer<typeof emailSchema>) {
  const data = emailSchema.parse(input)
  const ip = await clientIp()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const rows = await db
    .select({ attempt_key: authAttempts.attempt_key, created_at: authAttempts.created_at })
    .from(authAttempts)
    .where(
      and(inArray(authAttempts.attempt_key, keysFor(data.email, ip)), gte(authAttempts.created_at, since)),
    )
    .orderBy(desc(authAttempts.created_at))

  const grouped = new Map<string, string[]>()
  for (const row of rows) {
    grouped.set(row.attempt_key, [...(grouped.get(row.attempt_key) ?? []), row.created_at])
  }

  for (const stamps of grouped.values()) {
    if (stamps.length >= MAX_FAILURES) {
      const oldestInWindow = new Date(stamps[stamps.length - 1]!).getTime()
      const retryAfter = Math.max(1, Math.ceil((oldestInWindow + WINDOW_MS - Date.now()) / 1000))
      return { allowed: false as const, retryAfter }
    }
  }

  return { allowed: true as const, retryAfter: 0 }
}

/** Logs one failed sign-in against both the email and the network address. */
export async function recordSignInFailure(input: z.infer<typeof emailSchema>) {
  const data = emailSchema.parse(input)
  const ip = await clientIp()

  await db
    .insert(authAttempts)
    .values(keysFor(data.email, ip).map((attempt_key) => ({ attempt_key, kind: "signin" })))

  // Opportunistic cleanup so the table stays small.
  await db
    .delete(authAttempts)
    .where(lt(authAttempts.created_at, new Date(Date.now() - WINDOW_MS * 4).toISOString()))

  return { ok: true as const }
}

/** Clears the cooldown after a successful sign-in. */
export async function clearSignInFailures(input: z.infer<typeof emailSchema>) {
  const data = emailSchema.parse(input)
  const ip = await clientIp()
  await db.delete(authAttempts).where(inArray(authAttempts.attempt_key, keysFor(data.email, ip)))
  return { ok: true as const }
}
