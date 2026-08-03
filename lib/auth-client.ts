import { createAuthClient } from "better-auth/react";

/**
 * The auth client talks to the Better Auth handler mounted at /api/auth on the
 * same origin, so no baseURL is needed — it defaults to the current origin in
 * the browser.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword } = authClient;
