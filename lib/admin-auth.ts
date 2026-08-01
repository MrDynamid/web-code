import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Returns the current session, or null. Safe to call anywhere on the server.
 */
export async function getSession() {
  if (!auth?.api) return null
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

  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (allowed.length === 0 || !allowed.includes(session.user.email.toLowerCase())) {
    redirect('/')
  }
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
