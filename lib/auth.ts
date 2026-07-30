import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  // In development we intentionally leave baseURL unset so Better Auth infers
  // the origin per-request. This avoids "Invalid origin" when the app is
  // reached on localhost while V0_RUNTIME_URL points at the preview domain.
  baseURL:
    process.env.NODE_ENV === 'development'
      ? undefined
      : process.env.BETTER_AUTH_URL ??
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'https://localhost:3000']
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // In dev (v0 preview iframe / proxy), the request is forwarded with a
          // rewritten host while the browser Origin stays on localhost, which
          // trips Better Auth's origin check. Disable it in dev only; the
          // production build keeps the full CSRF/origin protection.
          disableCSRFCheck: true,
          // Force cross-site cookies so the session cookie is stored by the
          // browser inside the preview iframe.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
