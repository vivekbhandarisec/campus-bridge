import prisma from './prisma';

export async function awardCampusCred(userId: string, points: number, reason: string) {
  await prisma.$transaction([ 
    prisma.credEvent.create({
      data: {
        userId,
        points,
        reason,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { campusCred: { increment: points } },
    }),
  ]);
}
