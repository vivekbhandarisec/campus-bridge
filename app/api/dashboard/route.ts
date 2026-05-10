import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { getMentorMatches } from '@/lib/mentor-matches';

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
      roleSpecificData = {
        alumniMatches: await getMentorMatches(user, 5),
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
