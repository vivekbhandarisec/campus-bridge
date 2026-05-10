'use client';

import * as React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ src, name, className, ...props }, ref) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
    : 'CB';
  const showImage = Boolean(src && !imageFailed);

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div
      ref={ref}
      className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-sm font-semibold text-white', className)}
      {...props}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name || 'Profile avatar'}
          width={96}
          height={96}
          unoptimized
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-600 text-white">
          {initials ? <span>{initials}</span> : <User className="h-1/2 w-1/2" aria-hidden="true" />}
        </span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
