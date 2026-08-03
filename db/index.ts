import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool, types } = pg;

/**
 * The storefront was written against Supabase/PostgREST JSON, so every consumer
 * expects `numeric` columns as JS numbers and timestamps as ISO strings. Raw
 * node-postgres returns numerics as strings and timestamps as Date objects, so
 * we install per-pool type parsers to reproduce the old contract exactly.
 *
 * These parsers are scoped to the app pool only (via the `types` option) — the
 * Better Auth pool in lib/auth.ts keeps the default parsers so Better Auth
 * still receives real Date objects for its session/expiry logic.
 */
const NUMERIC_OID = 1700;
const TIMESTAMP_OID = 1114; // timestamp without time zone
const TIMESTAMPTZ_OID = 1184; // timestamp with time zone

function toIsoString(value: string | null): string | null {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

const appTypes = {
  getTypeParser: ((oid: number, format?: unknown) => {
    if (oid === NUMERIC_OID) {
      return (value: string | null) => (value === null ? null : Number(value));
    }
    if (oid === TIMESTAMP_OID || oid === TIMESTAMPTZ_OID) {
      return toIsoString;
    }
    return (types.getTypeParser as (oid: number, format?: unknown) => unknown)(oid, format);
  }) as typeof types.getTypeParser,
} as unknown as pg.CustomTypesConfig;

const globalForDb = globalThis as unknown as { __appPgPool?: pg.Pool };

export const pool =
  globalForDb.__appPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon requires TLS; the pooled connection string already includes sslmode.
    ssl: { rejectUnauthorized: false },
    types: appTypes,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__appPgPool = pool;

export const db = drizzle(pool, { schema });
