import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSuitableMatch, normalizeMatchValue, scoreMentorMatch } from '@/lib/match-score';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, domain: true, skills: true },
  });
  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (currentUser.role !== 'STUDENT') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const relevanceFilters = [
    ...(currentUser.domain ? [{ domain: currentUser.domain }] : []),
    ...(currentUser.skills.length > 0 ? [{ skills: { hasSome: currentUser.skills } }] : []),
  ];

  const alumni = await prisma.user.findMany({
    where: {
      role: 'ALUMNI',
      id: { not: currentUser.id },
      ...(relevanceFilters.length > 0 ? { OR: relevanceFilters } : {}),
    },
    select: {
      id: true,
      name: true,
      college: true,
      domain: true,
      skills: true,
      currentCompany: true,
      campusCred: true,
      avatarUrl: true,
      isAvailable: true,
    },
  });

  const matches = alumni
    .map((mentor) => ({
      ...mentor,
      matchScore: scoreMentorMatch(currentUser, mentor),
    }))
    .filter((mentor) => isSuitableMatch(mentor.matchScore))
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;

      const aDomain = a.domain && currentUser.domain && normalizeMatchValue(a.domain) === normalizeMatchValue(currentUser.domain) ? 1 : 0;
      const bDomain = b.domain && currentUser.domain && normalizeMatchValue(b.domain) === normalizeMatchValue(currentUser.domain) ? 1 : 0;
      if (aDomain !== bDomain) return bDomain - aDomain;

      const studentSkills = new Set(currentUser.skills.map(normalizeMatchValue));
      const aOverlap = a.skills.map(normalizeMatchValue).filter((skill) => studentSkills.has(skill)).length;
      const bOverlap = b.skills.map(normalizeMatchValue).filter((skill) => studentSkills.has(skill)).length;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;

      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  return NextResponse.json(matches);
}
