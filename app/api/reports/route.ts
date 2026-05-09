import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, itemId, reason, description } = await request.json();

    // Validate required fields
    if (!type || !itemId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has already reported this item
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: userId,
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
        reporterId: userId,
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
