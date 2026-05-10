export const MIN_MATCH_SCORE = 42;

type MatchProfile = {
  domain: string | null;
  skills: string[];
  campusCred?: number;
  bio?: string | null;
  headline?: string | null;
  isAvailable?: boolean;
  postsCount?: number;
  badgesCount?: number;
};

export function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

export const DOMAIN_FAMILIES: Record<string, string[]> = {
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

const GOAL_TERMS = [
  'internship',
  'placement',
  'mentor',
  'mentorship',
  'career',
  'interview',
  'referral',
  'ctf',
  'hackathon',
  'open source',
  'startup',
  'research',
  'leadership',
  'networking',
  'product',
  'ai',
  'machine learning',
  'software engineering',
];

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function readableDomain(domain: string) {
  return domain.replace(/[-_]+/g, ' ');
}

function familyForDomain(domain: string) {
  return Object.entries(DOMAIN_FAMILIES).find(([, domains]) => domains.includes(domain))?.[0] ?? domain;
}

function goalTokens(profile: MatchProfile) {
  const text = `${profile.headline ?? ''} ${profile.bio ?? ''}`.toLowerCase();
  return GOAL_TERMS.filter((term) => text.includes(term));
}

export function getDomainFamily(domain: string | null) {
  return domain ? familyForDomain(normalizeMatchValue(domain)) : '';
}

export function scoreMentorMatch(student: MatchProfile, mentor: MatchProfile) {
  const studentDomain = student.domain ? normalizeMatchValue(student.domain) : '';
  const mentorDomain = mentor.domain ? normalizeMatchValue(mentor.domain) : '';
  const studentFamily = studentDomain ? familyForDomain(studentDomain) : '';
  const mentorFamily = mentorDomain ? familyForDomain(mentorDomain) : '';
  const exactDomainScore = studentDomain && mentorDomain && studentDomain === mentorDomain ? 45 : 0;
  const domainFamilyScore = !exactDomainScore && studentFamily && mentorFamily && studentFamily === mentorFamily ? 38 : 0;

  const studentSkills = new Set(student.skills.map(normalizeMatchValue));
  const mentorSkills = mentor.skills.map(normalizeMatchValue);
  const overlap = mentorSkills.filter((skill) => studentSkills.has(skill)).length;
  const skillScore = studentSkills.size > 0 ? Math.min(28, Math.round((overlap / studentSkills.size) * 28)) : 0;
  const studentGoals = new Set(goalTokens(student));
  const mentorGoals = goalTokens(mentor);
  const goalOverlap = mentorGoals.filter((goal) => studentGoals.has(goal)).length;
  const goalScore = studentGoals.size > 0 ? Math.min(10, goalOverlap * 5) : 0;
  const activityScore = Math.min(8, (mentor.postsCount ?? 0) * 2 + (mentor.badgesCount ?? 0));
  const availabilityScore = mentor.isAvailable === false ? 0 : 7;
  const credScore = Math.min(5, Math.floor((mentor.campusCred || 0) / 100));

  return Math.max(0, Math.min(100, exactDomainScore + domainFamilyScore + skillScore + goalScore + activityScore + availabilityScore + credScore));
}

export function isSuitableMatch(score: number) {
  return score >= MIN_MATCH_SCORE;
}

export function explainMentorMatch(student: MatchProfile, mentor: MatchProfile) {
  const studentDomain = student.domain ? normalizeMatchValue(student.domain) : '';
  const mentorDomain = mentor.domain ? normalizeMatchValue(mentor.domain) : '';
  const studentFamily = getDomainFamily(student.domain);
  const mentorFamily = getDomainFamily(mentor.domain);
  const studentSkills = new Set(student.skills.map(normalizeMatchValue));
  const sharedSkills = mentor.skills.filter((skill) => studentSkills.has(normalizeMatchValue(skill)));
  const studentGoals = new Set(goalTokens(student));
  const sharedGoals = goalTokens(mentor).filter((goal) => studentGoals.has(goal));
  const reasons: string[] = [];

  if (studentDomain && mentorDomain && studentDomain === mentorDomain) {
    reasons.push(`Common background in ${readableDomain(mentor.domain ?? '')}.`);
  } else if (studentFamily && studentFamily === mentorFamily) {
    reasons.push(`You both work around the ${readableDomain(studentFamily)} track.`);
  }
  if (sharedSkills.length > 0) {
    reasons.push(`Shared skills in ${formatList(sharedSkills.slice(0, 3))}.`);
  }
  if (sharedGoals.length > 0) {
    reasons.push(`Common professional goals around ${formatList(sharedGoals.slice(0, 2))}.`);
  }
  if (mentor.isAvailable !== false) reasons.push('Open to student mentorship conversations.');
  if ((mentor.postsCount ?? 0) > 0 || (mentor.badgesCount ?? 0) > 0) reasons.push('Active in the CampusBridge community.');

  return reasons.slice(0, 4);
}
