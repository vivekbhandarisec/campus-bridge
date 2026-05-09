import { getCampusCredProgress } from '@/lib/campusCred';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp } from 'lucide-react';

interface CampusCredProgressProps {
  points: number;
  showProgress?: boolean;
  compact?: boolean;
}

export function CampusCredProgress({ points, showProgress = true, compact = false }: CampusCredProgressProps) {
  const { current, progress, nextTier, pointsToNext } = getCampusCredProgress(points);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span className={`font-semibold ${current.color}`}>
          {current.name}
        </span>
        <span className="text-sm text-muted-foreground">
          ({points} pts)
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-3">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">CampusCred</h3>
            <p className="text-sm text-muted-foreground">Your campus reputation score</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-amber-500">{points}</p>
          <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${current.className}`}>
            {current.name}
          </div>
        </div>
      </div>

      {showProgress && nextTier && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to {nextTier.name}</span>
            <span className="font-medium">{pointsToNext} pts to go</span>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{current.minPoints} pts</span>
              <span>{nextTier.minPoints} pts</span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              <span className="font-medium text-sky-600">
                {progress.toFixed(1)}% complete
              </span>
            </div>
          </div>
        </div>
      )}

      {!nextTier && (
        <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 p-4 border border-amber-200">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h4 className="font-bold text-amber-700">Maximum Level Reached!</h4>
            <p className="text-sm text-amber-600">You have achieved Legend status</p>
          </div>
        </div>
      )}
    </div>
  );
}
