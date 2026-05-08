import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[108px] w-full rounded-[10px] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-[3px] focus:ring-sky-500/10',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

export { Textarea };
