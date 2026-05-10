import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/utils';
import { syncIdentityCapabilities } from '@/lib/capabilities';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, username, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI'].includes(role) ? role : '';
    const normalizedUsername = typeof username === 'string' ? normalizeUsername(username) : '';
    const normalizedDomain = domain;
    const normalizedSkills = skills;

    if (!normalizedRole || !normalizedUsername || !college) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!normalizedDomain || !Array.isArray(normalizedSkills) || normalizedSkills.length === 0) {
      return NextResponse.json({ message: 'Domain and skills are required for student and alumni profiles' }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]{2,19}$/.test(normalizedUsername)) {
      return NextResponse.json({ message: 'Username must be 3–20 characters, start with a letter, and only include letters, numbers, or underscores.' }, { status: 400 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = clerkUser.fullName || 'CampusBridge member';

    const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existingUsername && existingUsername.clerkId !== userId && existingUsername.email !== email) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }

    const avatarUrl = 'profileImageUrl' in clerkUser ? (clerkUser as any).profileImageUrl : clerkUser.imageUrl;
    const mentorCompany = normalizedRole === 'ALUMNI' ? currentCompany || null : null;
    const availableForMentorship = normalizedRole === 'ALUMNI' ? Boolean(isAvailable) : true;
    const parsedGraduationYear = Number.isFinite(Number(graduationYear)) ? Number(graduationYear) : null;
    const currentYear = new Date().getFullYear();

    if (!parsedGraduationYear) {
      return NextResponse.json({ message: 'Graduation year is required' }, { status: 400 });
    }
    if (normalizedRole === 'ALUMNI' && parsedGraduationYear > currentYear) {
      return NextResponse.json({ message: 'Alumni graduation year must be this year or earlier' }, { status: 400 });
    }
    if (normalizedRole === 'STUDENT' && parsedGraduationYear <= currentYear) {
      return NextResponse.json({ message: 'Student graduation year must be after the current year' }, { status: 400 });
    }

    const existingProfile = await prisma.user.findFirst({
      where: { OR: [{ clerkId: userId }, { email }] },
      select: { id: true },
    });

    const profileData = {
      clerkId: userId,
      email,
      username: normalizedUsername,
      name,
      role: normalizedRole,
      college,
      branch: branch || null,
      graduationYear: parsedGraduationYear,
      domain: normalizedDomain,
      skills: normalizedSkills,
      bio: bio || null,
      currentCompany: mentorCompany,
      isAvailable: availableForMentorship,
      avatarUrl: avatarUrl || null,
    };

    const user = existingProfile
      ? await prisma.user.update({ where: { id: existingProfile.id }, data: profileData })
      : await prisma.user.create({ data: profileData });

    await syncIdentityCapabilities(user.id, user.role, availableForMentorship);
    return NextResponse.json({ ...user, profileComplete: true });
  } catch (error) {
    console.error('User setup failed:', error);
    return NextResponse.json({ message: 'Profile setup failed. Check server logs for details.' }, { status: 500 });
  }
}
