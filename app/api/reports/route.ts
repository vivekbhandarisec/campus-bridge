import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasAnyCapability } from '@/lib/capabilities';

const reportTypes = new Set(['POST', 'USER', 'COMMENT']);

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, capabilities: { select: { capability: true } } },
  });
  if (!currentUser || !hasAnyCapability(currentUser, ['MODERATOR', 'ADMIN'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { type, itemId, reason, description } = await request.json();

    // Validate required fields
    if (!type || !itemId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!reportTypes.has(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Check if user has already reported this item
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: currentUser.id,
        itemType: type,
        itemId: itemId,
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this item' }, { status: 409 });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: currentUser.id,
        itemType: type, // 'POST' | 'USER' | 'COMMENT'
        itemId: itemId,
        reason,
        description: description || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
