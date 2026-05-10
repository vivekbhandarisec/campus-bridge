require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required');
  }

  const client = new Client({
    connectionString,
    ssl: /supabase|pooler/i.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    const stale = await client.query(`
      SELECT id
      FROM "User"
      WHERE "role"::text = 'COLLEGE_ADMIN'
    `);

    if (stale.rowCount === 0) {
      await client.query('COMMIT');
      console.log('No COLLEGE_ADMIN role rows found.');
      return;
    }

    const capabilityTable = await client.query(`SELECT to_regclass('public."UserCapability"') AS table_name`);
    const capabilityEnum = await client.query(`SELECT to_regtype('"Capability"') AS enum_name`);
    const hasCapabilityStorage = Boolean(capabilityTable.rows[0]?.table_name && capabilityEnum.rows[0]?.enum_name);

    if (hasCapabilityStorage) {
      await client.query(`
        INSERT INTO "UserCapability" ("id", "userId", "capability", "assignedAt")
        SELECT md5(random()::text || clock_timestamp()::text), id, 'ORGANIZER'::"Capability", CURRENT_TIMESTAMP
        FROM "User"
        WHERE "role"::text = 'COLLEGE_ADMIN'
        ON CONFLICT ("userId", "capability") DO NOTHING
      `);
    }

    const result = await client.query(`
      UPDATE "User"
      SET "role" = 'ALUMNI'::"Role"
      WHERE "role"::text = 'COLLEGE_ADMIN'
    `);

    await client.query('COMMIT');
    console.log(`Normalized ${result.rowCount} COLLEGE_ADMIN user(s) to ALUMNI${hasCapabilityStorage ? ' with ORGANIZER capability' : ''}.`);
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
