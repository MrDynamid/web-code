import { headers } from "next/headers"
import { cache } from "react"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { userRoles } from "@/db/schema"

/**
 * Replaces the TanStack `requireAuth` middleware. `cache()` dedupes the session
 * lookup across every component in a single render pass, so a page that checks
 * auth in three places still only hits the session table once.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

/**
 * Throws when there is no session. Every user-owned query must scope by the id
 * this returns — Neon has no RLS, so per-query scoping is the only thing
 * stopping one shopper from reading another's orders.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId()
  if (!userId) throw new Error("You need to be signed in to do that.")
  return userId
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.user) throw new Error("You need to be signed in to do that.")
  return session.user
}

/** True when the signed-in user holds the admin role. */
export const isAdmin = cache(async (): Promise<boolean> => {
  const userId = await getUserId()
  if (!userId) return false
  const [row] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.user_id, userId), eq(userRoles.role, "admin")))
    .limit(1)
  return Boolean(row)
})

export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId()
  if (!(await isAdmin())) throw new Error("Admins only.")
  return userId
}
