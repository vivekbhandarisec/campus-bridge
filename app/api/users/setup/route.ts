import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

async function createProfileEmbedding(profileText: string) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: profileText,
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (embedding?.length) return embedding;
  } catch (error) {
    console.warn('OpenAI embedding failed during onboarding, using fallback embedding:', error);
  }

  return new Array(1536).fill(0).map((_, index) => {
    const charCode = profileText.charCodeAt(index % Math.max(profileText.length, 1)) || 0;
    return ((charCode + index) % 2000) / 1000 - 1;
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI', 'COLLEGE_ADMIN'].includes(role) ? role : '';

    if (!normalizedRole || !college || !domain || !Array.isArray(skills)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = clerkUser.fullName || 'CampusBridge member';

    const avatarUrl = 'profileImageUrl' in clerkUser ? (clerkUser as any).profileImageUrl : clerkUser.imageUrl;
    const mentorCompany = normalizedRole === 'ALUMNI' ? currentCompany || null : null;
    const availableForMentorship = normalizedRole === 'ALUMNI' ? Boolean(isAvailable) : true;
    const parsedGraduationYear = Number.isFinite(Number(graduationYear)) ? Number(graduationYear) : null;
    const profileText = `Name: ${name}. Role: ${normalizedRole}. College: ${college}. Domain: ${domain}. Skills: ${skills.join(', ')}.${bio ? ` Bio: ${bio}.` : ''}${mentorCompany ? ` Currently at: ${mentorCompany}.` : ''} Graduation year: ${parsedGraduationYear ?? 'N/A'}.`;
    const embedding = await createProfileEmbedding(profileText);
    const embeddingVector = JSON.stringify(embedding);

    const users = await prisma.$queryRaw`
      INSERT INTO "User" (
        id, "clerkId", email, name, role, college, branch, "graduationYear",
        domain, skills, bio, "currentCompany", "isAvailable", "avatarUrl", embedding
      )
      VALUES (
        ${randomUUID()}, ${userId}, ${email}, ${name}, ${normalizedRole}::"Role", ${college}, ${branch || null},
        ${parsedGraduationYear}, ${domain}, ${skills}, ${bio || null}, ${mentorCompany},
        ${availableForMentorship}, ${avatarUrl || null}, ${embeddingVector}::vector
      )
      ON CONFLICT ("clerkId") DO UPDATE SET
        email = EXCLUDED.email,
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
      RETURNING id, "clerkId", email, name, role, college, branch, "graduationYear",
        bio, skills, domain, "currentCompany", "avatarUrl", "campusCred",
        "isAvailable", "createdAt"
    `;

    return NextResponse.json(Array.isArray(users) ? users[0] : users);
  } catch (error) {
    console.error('User setup failed:', error);
    return NextResponse.json({ message: 'Profile setup failed. Check server logs for details.' }, { status: 500 });
  }
}
