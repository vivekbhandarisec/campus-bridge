import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncIdentityCapabilities } from '@/lib/capabilities';
import { awardCampusCredOnce } from '@/lib/cred';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function cleanOptionalUrl(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

async function uploadResume(file: File, userId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Resume upload needs Supabase configuration.');
  }
  if (!RESUME_TYPES.has(file.type)) {
    throw new Error('Resume must be a PDF, DOC, or DOCX file.');
  }
  if (file.size > MAX_RESUME_SIZE) {
    throw new Error('Resume must be 5 MB or smaller.');
  }

  const extension = file.name.split('.').pop() || 'pdf';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('resumes')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  return data.publicUrl;
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let body: Record<string, any>;
    let resumeFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        role: formData.get('role'),
        college: formData.get('college'),
        branch: formData.get('branch'),
        graduationYear: formData.get('graduationYear'),
        domain: formData.get('domain'),
        skills: JSON.parse(String(formData.get('skills') ?? '[]')),
        bio: formData.get('bio'),
        currentCompany: formData.get('currentCompany'),
        isAvailable: formData.get('isAvailable') === 'true',
        portfolioUrl: formData.get('portfolioUrl'),
      };
      const maybeFile = formData.get('resume');
      resumeFile = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;
    } else {
      body = await req.json();
    }

    const { role, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI'].includes(role) ? role : '';
    const normalizedDomain = domain;
    const normalizedSkills = skills;
    const portfolioUrl = cleanOptionalUrl(body.portfolioUrl);

    if (!normalizedRole || !college) {
      return NextResponse.json({ message: 'Role and college are required' }, { status: 400 });
    }

    if (!normalizedDomain || !Array.isArray(normalizedSkills) || normalizedSkills.length === 0) {
      return NextResponse.json({ message: 'Domain and skills are required for student and alumni profiles' }, { status: 400 });
    }
    if (portfolioUrl === '') {
      return NextResponse.json({ message: 'Portfolio link must be a valid HTTP or HTTPS URL.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!existingUser) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

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

    const resumeUrl = resumeFile ? await uploadResume(resumeFile, existingUser.id) : existingUser.resumeUrl;

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        role: normalizedRole,
        college,
        branch: branch || null,
        graduationYear: parsedGraduationYear,
        domain: normalizedDomain,
        skills: normalizedSkills,
        bio: bio || null,
        currentCompany: mentorCompany,
        isAvailable: availableForMentorship,
        portfolioUrl,
        resumeUrl,
      },
    });

    await syncIdentityCapabilities(user.id, user.role, availableForMentorship);
    const rewards = await Promise.all([
      !existingUser.resumeUrl && user.resumeUrl
        ? awardCampusCredOnce(user.id, 10, 'profile_resume_added')
        : Promise.resolve(false),
      !existingUser.portfolioUrl && user.portfolioUrl
        ? awardCampusCredOnce(user.id, 10, 'profile_portfolio_added')
        : Promise.resolve(false),
    ]);

    const awardedPoints = rewards.filter(Boolean).length * 10;
    return NextResponse.json({ ...user, profileComplete: true, awardedPoints });
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
      await prisma.$transaction(async (tx) => {
        const authoredPosts = await tx.post.findMany({
          where: { authorId: user.id },
          select: { id: true },
        });
        const authoredPostIds = authoredPosts.map((post) => post.id);

        const commentLayers: string[][] = [];
        const initialComments = await tx.comment.findMany({
          where: {
            OR: [
              { authorId: user.id },
              ...(authoredPostIds.length > 0 ? [{ postId: { in: authoredPostIds } }] : []),
            ],
          },
          select: { id: true },
        });
        let frontier = initialComments.map((comment) => comment.id);
        const seenCommentIds = new Set(frontier);
        if (frontier.length > 0) commentLayers.push(frontier);

        while (frontier.length > 0) {
          const replies = await tx.comment.findMany({
            where: { parentId: { in: frontier } },
            select: { id: true },
          });
          frontier = replies.map((reply) => reply.id).filter((id) => !seenCommentIds.has(id));
          frontier.forEach((id) => seenCommentIds.add(id));
          if (frontier.length > 0) commentLayers.push(frontier);
        }

        const affectedCommentIds = Array.from(seenCommentIds);
        const polls = authoredPostIds.length > 0
          ? await tx.poll.findMany({
              where: { postId: { in: authoredPostIds } },
              select: { id: true, options: { select: { id: true } } },
            })
          : [];
        const pollIds = polls.map((poll) => poll.id);
        const pollOptionIds = polls.flatMap((poll) => poll.options.map((option) => option.id));

        await tx.report.deleteMany({
          where: {
            OR: [
              { reporterId: user.id },
              { itemType: 'USER', itemId: user.id },
              ...(authoredPostIds.length > 0 ? [{ itemType: 'POST' as const, itemId: { in: authoredPostIds } }] : []),
              ...(affectedCommentIds.length > 0 ? [{ itemType: 'COMMENT' as const, itemId: { in: affectedCommentIds } }] : []),
            ],
          },
        });

        await tx.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
        await tx.messageRequest.deleteMany({ where: { OR: [{ requesterId: user.id }, { receiverId: user.id }] } });
        await tx.userBlock.deleteMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } });
        await tx.mentorRelation.deleteMany({ where: { OR: [{ mentorId: user.id }, { menteeId: user.id }] } });
        await tx.orbit.deleteMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } });
        await tx.eventRegistration.deleteMany({ where: { userId: user.id } });
        await tx.userCapability.deleteMany({ where: { userId: user.id } });
        await tx.organizerVerification.deleteMany({ where: { userId: user.id } });
        await tx.achievementBadge.deleteMany({ where: { userId: user.id } });
        await tx.event.updateMany({ where: { organizerId: user.id }, data: { organizerId: null } });
        await tx.credEvent.deleteMany({ where: { userId: user.id } });

        await tx.pollVote.deleteMany({ where: { userId: user.id } });
        if (pollOptionIds.length > 0) {
          await tx.pollVote.deleteMany({ where: { optionId: { in: pollOptionIds } } });
        }

        await tx.like.deleteMany({
          where: {
            OR: [
              { userId: user.id },
              ...(authoredPostIds.length > 0 ? [{ postId: { in: authoredPostIds } }] : []),
            ],
          },
        });
        await tx.share.deleteMany({
          where: {
            OR: [
              { userId: user.id },
              ...(authoredPostIds.length > 0 ? [{ postId: { in: authoredPostIds } }] : []),
            ],
          },
        });
        await tx.bookmark.deleteMany({
          where: {
            OR: [
              { userId: user.id },
              ...(authoredPostIds.length > 0 ? [{ postId: { in: authoredPostIds } }] : []),
            ],
          },
        });

        for (const layer of [...commentLayers].reverse()) {
          await tx.comment.deleteMany({ where: { id: { in: layer } } });
        }

        if (pollOptionIds.length > 0) {
          await tx.pollOption.deleteMany({ where: { id: { in: pollOptionIds } } });
        }
        if (pollIds.length > 0) {
          await tx.poll.deleteMany({ where: { id: { in: pollIds } } });
        }
        if (authoredPostIds.length > 0) {
          await tx.post.deleteMany({ where: { id: { in: authoredPostIds } } });
        }

        await tx.user.delete({ where: { id: user.id } });
      });
    }

    const clerk = clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json({ message: 'Account deletion failed. Check server logs for details.' }, { status: 500 });
  }
}
