import { campusCredBadge } from '@/lib/utils';

interface CredBadgeProps {
  score: number;
}

export function CredBadge({ score }: CredBadgeProps) {
  const tier = campusCredBadge(score);
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tier.className}`}>
      {tier.label}
    </span>
  );
}
