import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId, points, reason } = await req.json();
  if (!userId || !points || !reason) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.credEvent.create({ data: { userId, points, reason } }),
    prisma.user.update({ where: { id: userId }, data: { campusCred: { increment: points } } }),
  ]);

  return NextResponse.json({ message: 'Cred awarded' });
}
