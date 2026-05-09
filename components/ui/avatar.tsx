import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ src, name, className, ...props }, ref) => {
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
    : 'CB';

  return (
    <div
      ref={ref}
      className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-sm font-semibold text-white', className)}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'Profile avatar'}
          width={96}
          height={96}
          unoptimized
          className="h-full w-full rounded-full object-cover"
        />
      ) : initials}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
