import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      college: true,
      branch: true,
      graduationYear: true,
      bio: true,
      skills: true,
      domain: true,
      currentCompany: true,
      linkedinUrl: true,
      githubUrl: true,
      avatarUrl: true,
      campusCred: true,
      isAvailable: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
