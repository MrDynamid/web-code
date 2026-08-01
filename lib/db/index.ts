import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  _pool?: Pool
  _db?: NodePgDatabase<typeof schema>
}

function resolveConnectionString(): string | null {
<<<<<<< HEAD
  // Prefer the Supabase-integration-managed connection strings, which always
  // point at the currently connected project. DATABASE_URL / SUPABASE_DB_URL
  // are kept only as manual fallbacks (they can go stale if the project that
  // originally set them is deleted).
  const raw =
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    null

  if (!raw) return null

  // Strip any `sslmode` query param. Newer pg / pg-connection-string versions
  // treat sslmode=require as verify-full, which rejects Supabase's certificate
  // chain. We handle TLS explicitly via the `ssl` pool option below instead.
  try {
    const url = new URL(raw)
    url.searchParams.delete('sslmode')
    url.searchParams.delete('supa')
    return url.toString()
  } catch {
    return raw.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '')
  }
=======
  return (
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    null
  )
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
}

/**
 * Lazily creates the connection pool only when first accessed, not at module
 * import time. This allows the module to be safely imported during Next.js
 * build (page-data collection) without a database connection string present.
 */
function getPool(): Pool {
  if (globalForDb._pool) return globalForDb._pool

  const connectionString = resolveConnectionString()
  if (!connectionString) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL or SUPABASE_DB_URL in your environment.',
    )
  }

  const p = new Pool({
    connectionString,
<<<<<<< HEAD
    ssl: /supabase|pooler|amazonaws|neon/.test(connectionString)
=======
    ssl: connectionString.includes('supabase.co')
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  })

  p.on('error', (err) => {
    console.error('Database pool error:', err.message)
  })

  if (process.env.NODE_ENV !== 'production') globalForDb._pool = p
  return p
}

/**
 * Lazy database instance. The pool is created on first access, not at import.
 */
function getDb(): NodePgDatabase<typeof schema> {
  if (globalForDb._db) return globalForDb._db
  const d = drizzle(getPool(), { schema })
  if (process.env.NODE_ENV !== 'production') globalForDb._db = d
  return d
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const real = getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (real as any)[prop]
  },
})

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (real as any)[prop]
  },
<<<<<<< HEAD
  // Better Auth detects the database dialect using the `in` operator
  // (e.g. `"connect" in db` -> Postgres). Without a `has` trap those checks
  // run against the empty proxy target and always return false, causing
  // "Failed to initialize database adapter". Delegate to the real pool.
  has(_target, prop) {
    return Reflect.has(getPool(), prop)
  },
=======
>>>>>>> b40138d1871002c6187013e20ed0edbe04d957d4
})
