import { Pool } from "pg";

// Parse DATABASE_URL or use individual env vars
const connectionString = process.env.DATABASE_URL;

// Create a connection pool
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Helper function to run queries
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  // Log slow queries in development
  if (process.env.NODE_ENV === "development" && duration > 100) {
    console.log("Slow query:", { text, duration, rows: result.rowCount });
  }

  return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Export pool for direct access if needed
export { pool };
