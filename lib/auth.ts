import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/mail";

const { Pool } = pg;

/**
 * Better Auth owns the user/session/account/verification tables. It needs a
 * pool with the DEFAULT node-postgres parsers so `expiresAt`/`createdAt` come
 * back as real Date objects (the app pool in db/index.ts rewrites timestamps to
 * ISO strings, which would break session-expiry math). So Better Auth gets its
 * own dedicated pool + drizzle instance here.
 */
const globalForAuth = globalThis as unknown as { __authPgPool?: pg.Pool };

const authPool =
  globalForAuth.__authPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForAuth.__authPgPool = authPool;

const authDb = drizzle(authPool, { schema });

/**
 * Resolve the public base URL across environments: an explicit override wins,
 * then the v0 preview runtime, then Vercel's production/deploy URLs, then local
 * dev. Better Auth uses this to build links and to validate request origins.
 */
function withProtocol(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

const baseURLCandidates = [
  process.env.BETTER_AUTH_URL,
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
].filter((value): value is string => Boolean(value));

const baseURL = baseURLCandidates.length
  ? withProtocol(baseURLCandidates[0]!)
  : "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set(
    [
      ...baseURLCandidates.map(withProtocol),
      "http://localhost:3000",
      // v0 preview and Vercel deploy proxies serve the app from generated
      // hostnames that aren't known at build time — trust their domains via
      // Better Auth wildcard patterns so auth works in preview/deploys.
      "https://*.vercel.run",
      "https://*.vusercontent.net",
      "https://*.vercel.app",
    ].filter(Boolean),
  ),
);

const isDev = process.env.NODE_ENV !== "production";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(authDb, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    // Sends a real email through Resend when RESEND_API_KEY is configured.
    // Without the key, sendPasswordResetEmail stashes the link (dev-only) and
    // logs it, so the reset journey still completes end to end while the store
    // is being set up.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, url });
    },
  },
  ...(googleEnabled
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          },
        },
      }
    : {}),
  user: {
    // Store the display name shoppers type at sign-up.
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          // Mirror the account into the app `profiles` table so checkout/account
          // prefill works immediately after sign-up.
          try {
            await authPool.query(
              `INSERT INTO profiles (id, full_name) VALUES ($1, $2)
               ON CONFLICT (id) DO NOTHING`,
              [createdUser.id, createdUser.name ?? null],
            );
          } catch (error) {
            console.error("[auth] failed to create profile row", error);
          }
        },
      },
    },
  },
  advanced: isDev
    ? {
        // The v0 preview renders the app inside a cross-site iframe; without
        // these attributes the browser drops the session cookie.
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
        },
      }
    : undefined,
});
