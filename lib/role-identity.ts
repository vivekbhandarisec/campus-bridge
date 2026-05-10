export type CampusIdentityRole = 'STUDENT' | 'ALUMNI' | string | null | undefined;

export function roleIdentity(role: CampusIdentityRole) {
  if (role === 'ALUMNI') {
    return {
      label: 'Alumni',
      shortLabel: 'AL',
      badge: 'border-violet-500/25 bg-violet-50 text-violet-700',
      border: 'border-l-violet-500',
      ring: 'ring-2 ring-violet-500/45',
      avatar: 'from-violet-600 to-fuchsia-500',
      panel: 'border-violet-500/25 bg-violet-50/70',
      text: 'text-violet-700',
    };
  }

  if (role === 'STUDENT') {
    return {
      label: 'Student',
      shortLabel: 'ST',
      badge: 'border-sky-500/25 bg-sky-50 text-sky-700',
      border: 'border-l-sky-500',
      ring: 'ring-2 ring-sky-500/45',
      avatar: 'from-sky-500 to-cyan-500',
      panel: 'border-sky-500/25 bg-sky-50/70',
      text: 'text-sky-700',
    };
  }

  return {
    label: 'Member',
    shortLabel: 'CB',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    border: 'border-l-slate-300',
    ring: 'ring-2 ring-slate-300/45',
    avatar: 'from-slate-500 to-slate-700',
    panel: 'border-slate-200 bg-slate-50',
    text: 'text-slate-700',
  };
}
