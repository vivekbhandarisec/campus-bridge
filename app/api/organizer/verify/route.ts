import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { hasAnyCapability } from '@/lib/capabilities';

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      capabilities: { select: { capability: true } },
    },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const rows = await prisma.$queryRaw<Array<{
    status: string;
    organization: string;
    roleTitle: string;
    createdAt: Date;
  }>>`
    SELECT status, organization, "roleTitle", "createdAt"
    FROM "OrganizerVerification"
    WHERE "userId" = ${currentUser.id}
    LIMIT 1
  `;

  return NextResponse.json({
    canOrganize: hasAnyCapability(currentUser, ['ORGANIZER', 'ADMIN']),
    verification: rows[0] ?? null,
  });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      college: true,
      role: true,
      capabilities: { select: { capability: true } },
    },
  });
  if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const payload = await req.json();
  const fullName = cleanText(payload.fullName || currentUser.name, 120);
  const collegeEmail = cleanText(payload.collegeEmail, 160);
  const organization = cleanText(payload.organization || currentUser.college, 160);
  const roleTitle = cleanText(payload.roleTitle, 120);
  const reason = cleanText(payload.reason, 600);
  const contactLink = cleanText(payload.contactLink, 300);

  if (!fullName || !organization || !roleTitle || !reason) {
    return NextResponse.json({ message: 'Name, organization, role/title, and reason are required.' }, { status: 400 });
  }
  if (reason.length < 30) {
    return NextResponse.json({ message: 'Please add a little more detail about the event you want to host.' }, { status: 400 });
  }
  if (collegeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collegeEmail)) {
    return NextResponse.json({ message: 'Enter a valid college or organization email.' }, { status: 400 });
  }
  if (!isValidUrl(contactLink)) {
    return NextResponse.json({ message: 'Contact link must be a valid URL.' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "OrganizerVerification" (
        id, "userId", "fullName", "collegeEmail", organization, "roleTitle", reason, "contactLink", status, "reviewedAt", "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()}, ${currentUser.id}, ${fullName}, ${collegeEmail || null}, ${organization}, ${roleTitle}, ${reason}, ${contactLink || null}, 'APPROVED', NOW(), NOW()
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "collegeEmail" = EXCLUDED."collegeEmail",
        organization = EXCLUDED.organization,
        "roleTitle" = EXCLUDED."roleTitle",
        reason = EXCLUDED.reason,
        "contactLink" = EXCLUDED."contactLink",
        status = 'APPROVED',
        "reviewedAt" = NOW(),
        "updatedAt" = NOW()
    `;

    await tx.userCapability.upsert({
      where: { userId_capability: { userId: currentUser.id, capability: 'ORGANIZER' } },
      update: {},
      create: { userId: currentUser.id, capability: 'ORGANIZER', assignedBy: 'organizer_verification' },
    });
  });

  revalidatePath('/events');
  revalidatePath('/admin/college');
  revalidatePath('/feed');

  return NextResponse.json({
    ok: true,
    canOrganize: true,
    capability: 'ORGANIZER',
  });
}
