import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../../database/migrations');

function getPool(): Pool {
  const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://bccs_dev:bccs_dev_password@localhost:5432/bccs_dev';
  return new Pool({ connectionString });
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>('SELECT name FROM _migrations ORDER BY name');
  return new Set(result.rows.map(r => r.name));
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations(pool?: Pool): Promise<{ applied: string[]; skipped: string[] }> {
  const ownPool = !pool;
  pool = pool ?? getPool();

  try {
    await ensureMigrationsTable(pool);
    const applied = await getAppliedMigrations(pool);
    const files = getMigrationFiles();

    const newlyApplied: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      if (applied.has(file)) {
        skipped.push(file);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        newlyApplied.push(file);
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
        throw err;
      } finally {
        client.release();
      }
    }

    return { applied: newlyApplied, skipped };
  } finally {
    if (ownPool) {
      await pool.end();
    }
  }
}

// CLI entry point
const isMain = process.argv[1] && (
  process.argv[1].endsWith('/migrate.ts') ||
  process.argv[1].endsWith('/migrate.js')
);

if (isMain) {
  console.log('Running database migrations...');
  runMigrations()
    .then(({ applied, skipped }) => {
      if (applied.length === 0) {
        console.log('No new migrations to apply.');
      } else {
        console.log(`Applied ${applied.length} migration(s).`);
      }
      console.log(`Skipped ${skipped.length} already-applied migration(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
