import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Returns the current session, or null. Safe to call anywhere on the server.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Requires an authenticated admin. Redirects to the admin sign-in page when
 * there is no active session. Returns the authenticated user.
 *
 * There is no row-level security on Neon, so every admin action must call this
 * (or getSessionUserId) to guarantee the request is authenticated.
 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session?.user) redirect('/admin/sign-in')
  return session.user
}

/**
 * Returns the authenticated user id, throwing when unauthenticated. Use inside
 * server actions that mutate data.
 */
export async function getSessionUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}
