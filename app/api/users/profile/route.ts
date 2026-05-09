import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function createProfileEmbedding(profileText: string) {
  return new Array(1536).fill(0).map((_, index) => {
    const charCode = profileText.charCodeAt(index % Math.max(profileText.length, 1)) || 0;
    return ((charCode + index) % 2000) / 1000 - 1;
  });
}

function collegeLocation(name: string) {
  if (name === 'GBPIET Pauri') {
    return { city: 'Pauri Garhwal', state: 'Uttarakhand' };
  }

  if (name === 'Other') {
    return { city: 'Unknown', state: 'Unknown' };
  }

  const city = name.split(' ').slice(-1)[0] || 'Unknown';
  return { city, state: 'India' };
}

async function syncCollegeAdmin(collegeName: string, userId: string, role: string) {
  if (role !== 'COLLEGE_ADMIN') {
    await prisma.college.updateMany({
      where: { adminClerkId: userId },
      data: { adminClerkId: null },
    });
    return;
  }

  const location = collegeLocation(collegeName);
  await prisma.college.upsert({
    where: { name: collegeName },
    update: {
      adminClerkId: userId,
      verified: true,
      ...location,
    },
    create: {
      name: collegeName,
      adminClerkId: userId,
      verified: true,
      ...location,
    },
  });
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI', 'COLLEGE_ADMIN'].includes(role) ? role : '';
    const isCollegeAdmin = normalizedRole === 'COLLEGE_ADMIN';
    const normalizedDomain = isCollegeAdmin ? null : domain;
    const normalizedSkills = isCollegeAdmin ? [] : skills;

    if (!normalizedRole || !college) {
      return NextResponse.json({ message: 'Role and college are required' }, { status: 400 });
    }

    if (!isCollegeAdmin && (!normalizedDomain || !Array.isArray(normalizedSkills) || normalizedSkills.length === 0)) {
      return NextResponse.json({ message: 'Domain and skills are required for student and alumni profiles' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!existingUser) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    const mentorCompany = normalizedRole === 'ALUMNI' ? currentCompany || null : null;
    const availableForMentorship = normalizedRole === 'ALUMNI' ? Boolean(isAvailable) : true;
    const parsedGraduationYear = Number.isFinite(Number(graduationYear)) ? Number(graduationYear) : null;
    const currentYear = new Date().getFullYear();

    if (!isCollegeAdmin) {
      if (!parsedGraduationYear) {
        return NextResponse.json({ message: 'Graduation year is required' }, { status: 400 });
      }
      if (normalizedRole === 'ALUMNI' && parsedGraduationYear > currentYear) {
        return NextResponse.json({ message: 'Alumni graduation year must be this year or earlier' }, { status: 400 });
      }
      if (normalizedRole === 'STUDENT' && parsedGraduationYear <= currentYear) {
        return NextResponse.json({ message: 'Student graduation year must be after the current year' }, { status: 400 });
      }
    }

    const profileText = isCollegeAdmin
      ? `Name: ${existingUser.name}. Role: ${normalizedRole}. College: ${college}.${bio ? ` Organizer note: ${bio}.` : ''}`
      : `Name: ${existingUser.name}. Role: ${normalizedRole}. College: ${college}. Domain: ${normalizedDomain}. Skills: ${normalizedSkills.join(', ')}.${bio ? ` Bio: ${bio}.` : ''}${mentorCompany ? ` Currently at: ${mentorCompany}.` : ''} Graduation year: ${parsedGraduationYear ?? 'N/A'}.`;
    const embeddingVector = JSON.stringify(createProfileEmbedding(profileText));

    const users = await prisma.$queryRaw`
      UPDATE "User"
      SET
        role = ${normalizedRole}::"Role",
        college = ${college},
        branch = ${branch || null},
        "graduationYear" = ${parsedGraduationYear},
        domain = ${normalizedDomain},
        skills = ${normalizedSkills},
        bio = ${bio || null},
        "currentCompany" = ${mentorCompany},
        "isAvailable" = ${availableForMentorship},
        embedding = ${embeddingVector}::vector
      WHERE "clerkId" = ${userId}
      RETURNING id, "clerkId", email, name, role, college, branch, "graduationYear",
        bio, skills, domain, "currentCompany", "avatarUrl", "campusCred",
        "isAvailable"
    `;

    await syncCollegeAdmin(college, userId, normalizedRole);

    const user = Array.isArray(users) ? users[0] : users;
    return NextResponse.json({ ...user, profileComplete: true });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json({ message: 'Profile update failed. Check server logs for details.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      await prisma.$transaction([
        prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } }),
        prisma.eventRegistration.deleteMany({ where: { userId: user.id } }),
        prisma.credEvent.deleteMany({ where: { userId: user.id } }),
        prisma.post.deleteMany({ where: { authorId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
    }

    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json({ message: 'Account deletion failed. Check server logs for details.' }, { status: 500 });
  }
}
