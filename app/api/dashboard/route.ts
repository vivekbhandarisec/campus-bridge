import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

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
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
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
      // Simplified alumni matches for students
      const alumniMatches = await prisma.user.findMany({
        where: {
          role: 'ALUMNI',
          isAvailable: true,
        },
        orderBy: { campusCred: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          currentCompany: true,
          avatarUrl: true,
          campusCred: true,
        },
      });
      roleSpecificData = { alumniMatches };
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
              college: { select: { name: true } }
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
