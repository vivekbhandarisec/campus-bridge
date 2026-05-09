require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) {
    console.log('No users found; skipping create smoke test.');
    return;
  }

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      body: `Smoke test post ${new Date().toISOString()}`,
      type: 'TEXT',
      visibility: 'PUBLIC',
      imageUrls: [],
      linkUrl: null,
    },
    select: { id: true, body: true },
  });

  await prisma.post.delete({ where: { id: post.id } });
  console.log(`Post create OK. Created and removed ${post.id}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
