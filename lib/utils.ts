export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export function badgeVariant(role: string) {
  switch (role) {
    case 'STUDENT':
      return 'bg-blue-100 text-blue-700';
    case 'ALUMNI':
      return 'bg-violet-100 text-violet-700';
    case 'COLLEGE_ADMIN':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function campusCredBadge(score: number) {
  if (score >= 500) {
    return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800' };
  }
  if (score >= 100) {
    return { label: 'Silver', className: 'bg-slate-100 text-slate-800' };
  }
  return { label: 'Bronze', className: 'bg-amber-100 text-amber-800' };
}

export function formatDate(dateString: string | Date) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
