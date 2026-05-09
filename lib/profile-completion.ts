export function isProfileComplete(user: {
  role?: string | null;
  college?: string | null;
  domain?: string | null;
  skills?: string[] | null;
}) {
  if (user.role === 'COLLEGE_ADMIN') {
    return Boolean(user.college);
  }

  return Boolean(user.college && user.domain && user.skills?.length);
}
