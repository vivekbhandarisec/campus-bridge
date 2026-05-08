import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUsers = await prisma.$queryRaw<Array<{ id: string; embedding: string | null }>>`
    SELECT id, embedding::text AS embedding
    FROM "User"
    WHERE "clerkId" = ${userId}
    LIMIT 1
  `;
  const currentUser = currentUsers[0];

  if (!currentUser?.embedding) {
    return NextResponse.json({ message: 'Profile incomplete or no embedding available' }, { status: 400 });
  }

  const role = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (role?.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const matches = await prisma.$queryRaw`
    SELECT id, name, college, domain, skills, "currentCompany", "campusCred", "avatarUrl", "isAvailable",
      ROUND((1 - (embedding <=> ${currentUser.embedding}::vector))::numeric * 100, 1) AS "matchScore"
    FROM "User"
    WHERE role = 'ALUMNI' AND "isAvailable" = true AND embedding IS NOT NULL AND id != ${currentUser.id}
    ORDER BY embedding <=> ${currentUser.embedding}::vector
    LIMIT 10
  `;

  return NextResponse.json(matches);
}
