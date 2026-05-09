export interface CampusCredTier {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  className: string;
}

export const CAMPUS_CRED_TIERS: CampusCredTier[] = [
  {
    level: 0,
    name: 'Newcomer',
    minPoints: 0,
    maxPoints: 99,
    color: 'text-slate-600',
    className: 'border-slate-200 bg-slate-50 text-slate-600'
  },
  {
    level: 1,
    name: 'Explorer',
    minPoints: 100,
    maxPoints: 299,
    color: 'text-green-600',
    className: 'border-green-200 bg-green-50 text-green-600'
  },
  {
    level: 2,
    name: 'Connector',
    minPoints: 300,
    maxPoints: 699,
    color: 'text-blue-600',
    className: 'border-blue-200 bg-blue-50 text-blue-600'
  },
  {
    level: 3,
    name: 'Influencer',
    minPoints: 700,
    maxPoints: 1499,
    color: 'text-purple-600',
    className: 'border-purple-200 bg-purple-50 text-purple-600'
  },
  {
    level: 4,
    name: 'Pioneer',
    minPoints: 1500,
    maxPoints: 2999,
    color: 'text-orange-600',
    className: 'border-orange-200 bg-orange-50 text-orange-600'
  },
  {
    level: 5,
    name: 'Legend',
    minPoints: 3000,
    maxPoints: Infinity,
    color: 'text-amber-600',
    className: 'border-amber-200 bg-amber-50 text-amber-600'
  }
];

export function getCampusCredTier(points: number): CampusCredTier {
  return CAMPUS_CRED_TIERS.reduce((currentTier, tier) => {
    return points >= tier.minPoints ? tier : currentTier;
  }, CAMPUS_CRED_TIERS[0]);
}

export function getCampusCredProgress(points: number): {
  current: CampusCredTier;
  progress: number;
  nextTier?: CampusCredTier;
  pointsToNext: number;
} {
  const currentTier = getCampusCredTier(points);
  const nextTier = CAMPUS_CRED_TIERS.find(tier => tier.level === currentTier.level + 1);
  
  if (!nextTier) {
    return {
      current: currentTier,
      progress: 100,
      pointsToNext: 0
    };
  }

  const tierRange = currentTier.maxPoints - currentTier.minPoints;
  const userProgressInTier = points - currentTier.minPoints;
  const progress = (userProgressInTier / tierRange) * 100;
  const pointsToNext = nextTier.minPoints - points;

  return {
    current: currentTier,
    progress: Math.min(progress, 100),
    nextTier,
    pointsToNext
  };
}
