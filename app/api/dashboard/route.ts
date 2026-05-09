import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isSuitableMatch, scoreMentorMatch } from '@/lib/match-score';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic user info with minimal select
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        name: true,
        role: true,
        college: true,
        campusCred: true,
        skills: true,
        domain: true,
        isAvailable: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentlyPublished = new Date(today);
    recentlyPublished.setDate(recentlyPublished.getDate() - 30);

    // Parallel queries for better performance
    const [events, recentPosts] = await Promise.all([
      // Optimized events query with minimal selects
      prisma.event.findMany({
        where: {
          OR: [
            { startDate: { gte: today } },
            { createdAt: { gte: recentlyPublished } },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { startDate: 'asc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          college: { select: { name: true } }
        }
      }),

      // Optimized posts query with minimal selects
      prisma.post.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          type: true,
          createdAt: true,
          _count: {
            select: { likes: true, comments: true, shares: true },
          },
        },
      }),
    ]);

    let roleSpecificData = {};

    if (user.role === 'STUDENT') {
      const matchCandidateFilters = [
        ...(user.domain ? [{ domain: user.domain }] : []),
        ...(user.skills.length > 0 ? [{ skills: { hasSome: user.skills } }] : []),
      ];

      // Simplified alumni matches for students
      const alumniMatches = await prisma.user.findMany({
        where: {
          role: 'ALUMNI',
          isAvailable: true,
          ...(matchCandidateFilters.length > 0 ? { OR: matchCandidateFilters } : {}),
        },
        orderBy: { campusCred: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          currentCompany: true,
          avatarUrl: true,
          campusCred: true,
          domain: true,
          skills: true,
        },
      });
      roleSpecificData = {
        alumniMatches: alumniMatches
          .map((mentor) => ({ ...mentor, matchScore: scoreMentorMatch(user, mentor) }))
          .filter((mentor) => isSuitableMatch(mentor.matchScore))
          .sort((a, b) => b.matchScore - a.matchScore || b.campusCred - a.campusCred || a.name.localeCompare(b.name))
          .slice(0, 5),
      };
    } else if (user.role === 'ALUMNI') {
      // Simplified mentorship requests for alumni
      const mentorshipRequests = await prisma.mentorRelation.findMany({
        where: {
          mentorId: user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              college: true,
            }
          },
        },
      });
      roleSpecificData = { mentorshipRequests };
    }

    return NextResponse.json({
      user,
      events,
      recentPosts,
      ...roleSpecificData,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
