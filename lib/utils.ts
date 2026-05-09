export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export function badgeVariant(role: string) {
  switch (role) {
    case 'STUDENT':
      return 'border-sky-500/20 bg-sky-50 text-sky-500';
    case 'ALUMNI':
      return 'border-navy/15 bg-navy text-white';
    case 'COLLEGE_ADMIN':
      return 'border-teal-600/20 bg-teal-50 text-teal-600';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export function campusCredBadge(score: number) {
  if (score >= 500) {
    return { label: 'Gold', className: 'border-reward-500/40 bg-reward-50 text-reward-500' };
  }
  if (score >= 100) {
    return { label: 'Silver', className: 'border-slate-300 bg-slate-100 text-slate-800' };
  }
  return { label: 'Bronze', className: 'border-reward-500/30 bg-reward-50 text-reward-500' };
}

export function formatDate(dateString: string | Date) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}
