import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import type { Prisma, Role } from '@prisma/client';
import { messagingEligibility } from '@/lib/messaging-policy';

export const dynamic = 'force-dynamic';

function cleanList(value: string | null) {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, college: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const role = searchParams.get('role');
    const college = searchParams.get('college')?.trim() ?? '';
    const skills = cleanList(searchParams.get('skills'));
    const industry = searchParams.get('industry')?.trim() ?? '';
    const type = searchParams.get('type') ?? 'all';
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const limit = 20;

    const roleFilter = role && ['STUDENT', 'ALUMNI'].includes(role)
      ? (role as Role)
      : undefined;

    const userWhere: Prisma.UserWhereInput = {
      AND: [
        roleFilter ? { role: roleFilter } : {},
        college ? { college: { contains: college, mode: 'insensitive' } } : {},
        industry ? { industry: { contains: industry, mode: 'insensitive' } } : {},
        skills.length > 0 ? { skills: { hasSome: skills } } : {},
        q ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { headline: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
            { college: { contains: q, mode: 'insensitive' } },
            { domain: { contains: q, mode: 'insensitive' } },
            { industry: { contains: q, mode: 'insensitive' } },
            { skills: { has: q } },
          ],
        } : {},
      ],
    };

    const eventWhere: Prisma.EventWhereInput = {
      AND: [
        college ? { college: { name: { contains: college, mode: 'insensitive' } } } : {},
        q ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { prize: { contains: q, mode: 'insensitive' } },
            { teamSize: { contains: q, mode: 'insensitive' } },
            { link: { contains: q, mode: 'insensitive' } },
            { college: { name: { contains: q, mode: 'insensitive' } } },
          ],
        } : {},
      ],
    };

    const [users, events] = await Promise.all([
      type === 'events'
        ? Promise.resolve([])
        : prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            role: true,
            headline: true,
            skills: true,
            college: true,
            domain: true,
            bio: true,
            campusCred: true,
            _count: {
              select: {
                orbitTo: true,
                posts: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ campusCred: 'desc' }, { name: 'asc' }],
        }),
      type === 'people' || roleFilter || skills.length > 0 || industry
        ? Promise.resolve([])
        : prisma.event.findMany({
          where: eventWhere,
          include: { college: { select: { name: true } } },
          orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
    ]);

    return NextResponse.json({
      users: users.map((user) => {
        const eligibility = messagingEligibility(currentUser, user);
        return {
          ...user,
          canMessage: eligibility.allowed,
          sameCollege: Boolean(eligibility.sameCollege),
          messageRestriction: eligibility.reason ?? null,
        };
      }),
      events,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
