import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ProfileSettingsForm } from '@/components/profile-settings-form';

export default async function ProfileSettingsPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/onboarding');

  return <ProfileSettingsForm user={user} />;
}
