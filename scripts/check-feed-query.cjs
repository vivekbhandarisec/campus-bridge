require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ select: { clerkId: true } });
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      authorId: true,
      body: true,
      type: true,
      visibility: true,
      createdAt: true,
      imageUrls: true,
      linkUrl: true,
      author: { select: { name: true, college: true, avatarUrl: true } },
      poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
      _count: { select: { likes: true, comments: true, shares: true, bookmarks: true } },
      likes: user
        ? { where: { user: { clerkId: user.clerkId } }, select: { id: true }, take: 1 }
        : { select: { id: true }, take: 0 },
      bookmarks: user
        ? { where: { user: { clerkId: user.clerkId } }, select: { id: true }, take: 1 }
        : { select: { id: true }, take: 0 },
    },
  });

  console.log(`Feed query OK. User present: ${Boolean(user)}. Posts checked: ${posts.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
