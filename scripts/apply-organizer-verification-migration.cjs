const fs = require('fs');
const crypto = require('crypto');
const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function main() {
  const migrationName = '20260510110000_organizer_verification';
  const sql = fs.readFileSync(`prisma/migrations/${migrationName}/migration.sql`, 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL is required');

  const client = new Client({
    connectionString,
    ssl: /supabase|pooler/i.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id VARCHAR(36) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.query(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       SELECT $1::varchar(36), $2::varchar(64), NOW(), $3::varchar(255), NULL, NULL, NOW(), 1
       WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $3::varchar(255))`,
      [crypto.randomUUID(), checksum, migrationName],
    );
    await client.query(
      `UPDATE "_prisma_migrations"
       SET checksum = $1::varchar(64), finished_at = COALESCE(finished_at, NOW()), applied_steps_count = 1
       WHERE migration_name = $2::varchar(255)`,
      [checksum, migrationName],
    );
    await client.query('COMMIT');
    console.log('organizer verification migration applied');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
