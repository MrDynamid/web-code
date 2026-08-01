import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  _pool?: Pool
  _db?: NodePgDatabase<typeof schema>
}

function resolveConnectionString(): string | null {
  return process.env.DATABASE_URL ?? null
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
    ssl: /pooler|amazonaws|neon/.test(connectionString)
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
  // Better Auth detects the database dialect using the `in` operator
  // (e.g. `"connect" in db` -> Postgres). Without a `has` trap those checks
  // run against the empty proxy target and always return false, causing
  // "Failed to initialize database adapter". Delegate to the real pool.
  has(_target, prop) {
    return Reflect.has(getPool(), prop)
  },
})
