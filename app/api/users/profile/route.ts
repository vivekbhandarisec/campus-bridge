import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncIdentityCapabilities } from '@/lib/capabilities';

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, college, branch, graduationYear, domain, skills, bio, currentCompany, isAvailable } = body;
    const normalizedRole = ['STUDENT', 'ALUMNI'].includes(role) ? role : '';
    const normalizedDomain = domain;
    const normalizedSkills = skills;

    if (!normalizedRole || !college) {
      return NextResponse.json({ message: 'Role and college are required' }, { status: 400 });
    }

    if (!normalizedDomain || !Array.isArray(normalizedSkills) || normalizedSkills.length === 0) {
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

    if (!parsedGraduationYear) {
      return NextResponse.json({ message: 'Graduation year is required' }, { status: 400 });
    }
    if (normalizedRole === 'ALUMNI' && parsedGraduationYear > currentYear) {
      return NextResponse.json({ message: 'Alumni graduation year must be this year or earlier' }, { status: 400 });
    }
    if (normalizedRole === 'STUDENT' && parsedGraduationYear <= currentYear) {
      return NextResponse.json({ message: 'Student graduation year must be after the current year' }, { status: 400 });
    }

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
      },
    });

    await syncIdentityCapabilities(user.id, user.role, availableForMentorship);
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

    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json({ message: 'Account deletion failed. Check server logs for details.' }, { status: 500 });
  }
}
