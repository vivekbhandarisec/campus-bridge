import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { awardCampusCred } from '@/lib/cred';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = params;
    const currentUserId = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (currentUserId.id === targetUserId) {
      return NextResponse.json({ error: 'You cannot orbit yourself' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if already orbiting
    const existingOrbit = await prisma.orbit.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: currentUserId.id,
          toUserId: targetUserId
        }
      }
    });

    if (existingOrbit) {
      return NextResponse.json({ error: 'Already orbiting' }, { status: 400 });
    }

    // Create orbit relationship
    const orbit = await prisma.orbit.create({
      data: {
        fromUserId: currentUserId.id,
        toUserId: targetUserId
      }
    });

    const reciprocal = await prisma.orbit.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: targetUserId,
          toUserId: currentUserId.id
        }
      }
    });

    await awardCampusCred(targetUserId, reciprocal ? 7 : 2, reciprocal ? 'became_aligned' : 'received_orbit');
    if (reciprocal) {
      await awardCampusCred(currentUserId.id, 5, 'became_aligned');
    }

    // TODO: Send notification to the user who was orbited
    // await sendNotification(targetUserId, `${currentUserName} added you to their orbit`);

    return NextResponse.json({ orbit });
  } catch (error) {
    console.error('Orbit creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = params;
    const currentUserId = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove orbit relationship
    await prisma.orbit.deleteMany({
      where: {
        fromUserId: currentUserId.id,
        toUserId: targetUserId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Orbit deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
