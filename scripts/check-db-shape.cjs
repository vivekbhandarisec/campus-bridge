require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRaw`
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('PostType', 'Visibility', 'MentorStatus')
    ORDER BY t.typname, e.enumsortorder
  `;
  const columns = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('Post', 'User')
    ORDER BY table_name, ordinal_position
  `;
  console.log(JSON.stringify({ enums, columns }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
