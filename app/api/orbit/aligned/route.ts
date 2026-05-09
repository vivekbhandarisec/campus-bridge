import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find users where both have orbited each other (aligned)
    const alignedUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            orbitTo: {
              some: {
                fromUserId: currentUserId.id
              }
            }
          },
          {
            orbitFrom: {
              some: {
                toUserId: currentUserId.id
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        headline: true,
        skills: true,
        college: true,
        campusCred: true,
      }
    });

    return NextResponse.json({ users: alignedUsers });
  } catch (error) {
    console.error('Aligned users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
