import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OnboardingForm from '@/components/onboarding-form';
import prisma from '@/lib/prisma';
import { isProfileComplete } from '@/lib/profile-completion';

export default async function OnboardingPage() {
  const { userId } = auth();
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { college: true, domain: true, skills: true },
    });

    if (user && isProfileComplete(user)) redirect('/feed');
  }

  return <OnboardingForm />;
}
