import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

/**
 * Better Auth mounts its entire REST surface here: /api/auth/sign-in,
 * /api/auth/callback/google, /api/auth/reset-password, etc. The client in
 * lib/auth-client.ts talks to this same origin, so no extra config is needed.
 */
export const { GET, POST } = toNextJsHandler(auth)
