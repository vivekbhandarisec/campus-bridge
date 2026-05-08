export function isProfileComplete(user: {
  college?: string | null;
  domain?: string | null;
  skills?: string[] | null;
}) {
  return Boolean(user.college && user.domain && user.skills?.length);
}
