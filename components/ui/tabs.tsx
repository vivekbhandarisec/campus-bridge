import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ options, value, onChange }: TabsProps) {
  return (
    <div className="rounded-[10px] bg-slate-100 p-1">
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition',
              value === option.value
                ? 'bg-white text-sky-500 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
