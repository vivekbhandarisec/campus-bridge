'use client';

export function LoadingIndicator({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full border-2 border-slate-200 border-t-sky-600 animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingIndicator size="lg" />
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LoadingIndicator size="sm" />
      {text && <span className="text-sm text-slate-600">{text}</span>}
    </div>
  );
}
