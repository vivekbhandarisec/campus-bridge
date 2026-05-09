export const MIN_MATCH_SCORE = 60;

type MatchProfile = {
  domain: string | null;
  skills: string[];
  campusCred?: number;
};

export function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase();
}

export function scoreMentorMatch(student: MatchProfile, mentor: MatchProfile) {
  const studentDomain = student.domain ? normalizeMatchValue(student.domain) : '';
  const mentorDomain = mentor.domain ? normalizeMatchValue(mentor.domain) : '';
  const domainScore = studentDomain && mentorDomain && studentDomain === mentorDomain ? 35 : 0;

  const studentSkills = new Set(student.skills.map(normalizeMatchValue));
  const mentorSkills = mentor.skills.map(normalizeMatchValue);
  const overlap = mentorSkills.filter((skill) => studentSkills.has(skill)).length;
  const skillScore = studentSkills.size > 0 ? Math.min(50, Math.round((overlap / studentSkills.size) * 50)) : 0;
  const credScore = Math.min(15, Math.floor((mentor.campusCred || 0) / 50));

  return Math.max(0, Math.min(100, domainScore + skillScore + credScore));
}

export function isSuitableMatch(score: number) {
  return score >= MIN_MATCH_SCORE;
}
