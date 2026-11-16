// Standalone migration runner — uses only 'pg' (no drizzle-kit needed).
// Reads SQL migration files and applies them in order, tracking state
// in a __drizzle_migrations table compatible with drizzle-kit.

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MIGRATIONS_DIR = path.join(__dirname, "drizzle");

function hashMigration(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  // Get already-applied migrations
  const { rows: applied } = await client.query(
    `SELECT hash FROM "__drizzle_migrations" ORDER BY id`
  );
  const appliedHashes = new Set(applied.map((r) => r.hash));

  // Read migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    const sql = fs
      .readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")
      .replace(/\r\n/g, "\n");
    const hash = hashMigration(sql);
    // Earlier Windows deploys recorded hashes of the CRLF checkout.
    const windowsHash = hashMigration(sql.replace(/\n/g, "\r\n"));
    if (appliedHashes.has(hash) || appliedHashes.has(windowsHash)) continue;

    console.log(`Applying migration: ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
        [hash, Date.now()]
      );
      await client.query("COMMIT");
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed to apply ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log(
    count > 0 ? `Applied ${count} migration(s)` : "No new migrations"
  );
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
