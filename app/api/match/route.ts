import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreMatch(student: { domain: string | null; skills: string[] }, alumni: { domain: string | null; skills: string[]; campusCred: number }) {
  const studentDomain = student.domain ? normalize(student.domain) : '';
  const alumniDomain = alumni.domain ? normalize(alumni.domain) : '';
  const domainScore = studentDomain && alumniDomain && studentDomain === alumniDomain ? 50 : 0;

  const studentSkills = new Set(student.skills.map(normalize));
  const alumniSkills = alumni.skills.map(normalize);
  const overlap = alumniSkills.filter((skill) => studentSkills.has(skill)).length;
  const skillScore = studentSkills.size > 0 ? Math.min(40, Math.round((overlap / studentSkills.size) * 40)) : 0;
  const credScore = Math.min(10, Math.floor(alumni.campusCred / 50));

  return Math.max(10, Math.min(100, domainScore + skillScore + credScore));
}

export async function GET() {
  console.time('match-api');
  const { userId } = auth();
  if (!userId) {
    console.timeEnd('match-api');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, domain: true, skills: true },
  });
  if (!currentUser) {
    console.timeEnd('match-api');
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (currentUser.role !== 'STUDENT') {
    console.timeEnd('match-api');
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const alumni = await prisma.user.findMany({
    where: {
      role: 'ALUMNI',
      id: { not: currentUser.id },
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
      matchScore: scoreMatch(currentUser, mentor),
    }))
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;

      const aDomain = a.domain && currentUser.domain && normalize(a.domain) === normalize(currentUser.domain) ? 1 : 0;
      const bDomain = b.domain && currentUser.domain && normalize(b.domain) === normalize(currentUser.domain) ? 1 : 0;
      if (aDomain !== bDomain) return bDomain - aDomain;

      const studentSkills = new Set(currentUser.skills.map(normalize));
      const aOverlap = a.skills.map(normalize).filter((skill) => studentSkills.has(skill)).length;
      const bOverlap = b.skills.map(normalize).filter((skill) => studentSkills.has(skill)).length;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;

      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  console.timeEnd('match-api');
  return NextResponse.json(matches);
}
