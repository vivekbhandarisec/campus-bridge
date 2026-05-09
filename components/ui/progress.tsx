import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-slate-200',
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-teal-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min((value || 0) / max * 100, 100)}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
