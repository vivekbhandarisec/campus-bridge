import type { Capability, Role } from '@prisma/client';
import prisma from './prisma';

export type CapabilityName = Capability;

export function hasCapability(
  user: { capabilities?: Array<{ capability: CapabilityName }> | null } | null | undefined,
  capability: CapabilityName,
) {
  return Boolean(user?.capabilities?.some((item) => item.capability === capability));
}

export function hasAnyCapability(
  user: { capabilities?: Array<{ capability: CapabilityName }> | null } | null | undefined,
  capabilities: CapabilityName[],
) {
  return Boolean(user?.capabilities?.some((item) => capabilities.includes(item.capability)));
}

export async function syncIdentityCapabilities(userId: string, role: Role, isAvailable: boolean) {
  const operations = [];

  if (role === 'ALUMNI' && isAvailable) {
    operations.push(
      prisma.userCapability.upsert({
        where: { userId_capability: { userId, capability: 'MENTOR' } },
        update: {},
        create: { userId, capability: 'MENTOR' },
      }),
    );
  } else {
    operations.push(
      prisma.userCapability.deleteMany({
        where: { userId, capability: 'MENTOR' },
      }),
    );
  }

  if (role === 'STUDENT') {
    operations.push(
      prisma.userCapability.deleteMany({
        where: { userId, capability: { in: ['RECRUITER', 'MODERATOR'] } },
      }),
    );
  }

  await prisma.$transaction(operations);
}
