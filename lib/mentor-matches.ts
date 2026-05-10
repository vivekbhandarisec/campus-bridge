import prisma from '@/lib/prisma';
import { explainMentorMatch, getDomainFamily, isSuitableMatch, normalizeMatchValue, scoreMentorMatch } from '@/lib/match-score';

type StudentForMatch = {
  id: string;
  domain: string | null;
  skills: string[];
  bio?: string | null;
  headline?: string | null;
};

const familyDomains: Record<string, string[]> = {
  security: ['cybersecurity', 'ethical-hacking', 'ctf'],
  development: ['frontend', 'backend', 'full-stack', 'mobile', 'game-development', 'open-source'],
  data: ['data-science', 'data-engineering', 'ml'],
  infrastructure: ['devops', 'cloud', 'database'],
  product: ['ui-ux', 'product-management'],
  hardware: ['iot', 'embedded-systems', 'robotics', 'ar-vr'],
  web3: ['web3'],
  programming: ['competitive-programming'],
  quality: ['qa-testing'],
};

export async function getMentorMatches(currentUser: StudentForMatch, limit = 10) {
  const domainFamily = getDomainFamily(currentUser.domain);
  const relatedDomains = domainFamily ? familyDomains[domainFamily] ?? [currentUser.domain].filter(Boolean) : [];
  const relevanceFilters = [
    ...(currentUser.domain ? [{ domain: currentUser.domain }] : []),
    ...(relatedDomains.length > 0 ? [{ domain: { in: relatedDomains } }] : []),
    ...(currentUser.skills.length > 0 ? [{ skills: { hasSome: currentUser.skills } }] : []),
  ];

  const alumni = await prisma.user.findMany({
    where: {
      role: 'ALUMNI',
      id: { not: currentUser.id },
      ...(relevanceFilters.length > 0 ? { OR: relevanceFilters } : {}),
    },
    select: {
      id: true,
      name: true,
      college: true,
      domain: true,
      skills: true,
      currentCompany: true,
      bio: true,
      headline: true,
      campusCred: true,
      avatarUrl: true,
      isAvailable: true,
      _count: { select: { posts: true, badges: true } },
    },
  });

  return alumni
    .map((mentor) => {
      const scoredMentor = {
        ...mentor,
        postsCount: mentor._count.posts,
        badgesCount: mentor._count.badges,
      };

      return {
        ...mentor,
        postsCount: mentor._count.posts,
        badgesCount: mentor._count.badges,
        matchScore: scoreMentorMatch(currentUser, scoredMentor),
        matchReasons: explainMentorMatch(currentUser, scoredMentor),
        _count: undefined,
      };
    })
    .filter((mentor) => isSuitableMatch(mentor.matchScore))
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;

      const aDomain = a.domain && currentUser.domain && normalizeMatchValue(a.domain) === normalizeMatchValue(currentUser.domain) ? 1 : 0;
      const bDomain = b.domain && currentUser.domain && normalizeMatchValue(b.domain) === normalizeMatchValue(currentUser.domain) ? 1 : 0;
      if (aDomain !== bDomain) return bDomain - aDomain;

      const studentSkills = new Set(currentUser.skills.map(normalizeMatchValue));
      const aOverlap = a.skills.map(normalizeMatchValue).filter((skill) => studentSkills.has(skill)).length;
      const bOverlap = b.skills.map(normalizeMatchValue).filter((skill) => studentSkills.has(skill)).length;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;

      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      if (a.postsCount !== b.postsCount) return b.postsCount - a.postsCount;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map(({ matchScore, ...mentor }) => mentor);
}
