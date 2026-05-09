import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/utils';

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

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, username, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI', 'COLLEGE_ADMIN'].includes(role) ? role : '';
    const normalizedUsername = typeof username === 'string' ? normalizeUsername(username) : '';
    const isCollegeAdmin = normalizedRole === 'COLLEGE_ADMIN';
    const normalizedDomain = isCollegeAdmin ? null : domain;
    const normalizedSkills = isCollegeAdmin ? [] : skills;

    if (!normalizedRole || !normalizedUsername || !college) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!isCollegeAdmin && (!normalizedDomain || !Array.isArray(normalizedSkills) || normalizedSkills.length === 0)) {
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
      ? `Name: ${name}. Role: ${normalizedRole}. College: ${college}.${bio ? ` Organizer note: ${bio}.` : ''}`
      : `Name: ${name}. Role: ${normalizedRole}. College: ${college}. Domain: ${normalizedDomain}. Skills: ${normalizedSkills.join(', ')}.${bio ? ` Bio: ${bio}.` : ''}${mentorCompany ? ` Currently at: ${mentorCompany}.` : ''} Graduation year: ${parsedGraduationYear ?? 'N/A'}.`;
    const embedding = createProfileEmbedding(profileText);
    const embeddingVector = JSON.stringify(embedding);

    let users = await prisma.$queryRaw`
      UPDATE "User"
      SET
        "clerkId" = ${userId},
        email = ${email},
        username = ${normalizedUsername},
        name = ${name},
        role = ${normalizedRole}::"Role",
        college = ${college},
        branch = ${branch || null},
        "graduationYear" = ${parsedGraduationYear},
        domain = ${normalizedDomain},
        skills = ${normalizedSkills},
        bio = ${bio || null},
        "currentCompany" = ${mentorCompany},
        "isAvailable" = ${availableForMentorship},
        "avatarUrl" = ${avatarUrl || null},
        embedding = ${embeddingVector}::vector
      WHERE "clerkId" = ${userId} OR email = ${email}
      RETURNING id, "clerkId", email, username, name, role, college, branch, "graduationYear",
        bio, skills, domain, "currentCompany", "avatarUrl", "campusCred",
        "isAvailable"
    `;

    if (Array.isArray(users) && users.length === 0) {
      users = await prisma.$queryRaw`
      INSERT INTO "User" (
        id, "clerkId", email, username, name, role, college, branch, "graduationYear",
        domain, skills, bio, "currentCompany", "isAvailable", "avatarUrl", embedding
      )
      VALUES (
        ${randomUUID()}, ${userId}, ${email}, ${normalizedUsername}, ${name}, ${normalizedRole}::"Role", ${college}, ${branch || null},
        ${parsedGraduationYear}, ${normalizedDomain}, ${normalizedSkills}, ${bio || null}, ${mentorCompany},
        ${availableForMentorship}, ${avatarUrl || null}, ${embeddingVector}::vector
      )
      ON CONFLICT ("clerkId") DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        college = EXCLUDED.college,
        branch = EXCLUDED.branch,
        "graduationYear" = EXCLUDED."graduationYear",
        domain = EXCLUDED.domain,
        skills = EXCLUDED.skills,
        bio = EXCLUDED.bio,
        "currentCompany" = EXCLUDED."currentCompany",
        "isAvailable" = EXCLUDED."isAvailable",
        "avatarUrl" = EXCLUDED."avatarUrl",
        embedding = EXCLUDED.embedding
      RETURNING id, "clerkId", email, username, name, role, college, branch, "graduationYear",
        bio, skills, domain, "currentCompany", "avatarUrl", "campusCred",
        "isAvailable"
      `;
    }

    await syncCollegeAdmin(college, userId, normalizedRole);

    const user = Array.isArray(users) ? users[0] : users;
    return NextResponse.json({ ...user, profileComplete: true });
  } catch (error) {
    console.error('User setup failed:', error);
    return NextResponse.json({ message: 'Profile setup failed. Check server logs for details.' }, { status: 500 });
  }
}
