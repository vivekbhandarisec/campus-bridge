'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SmoothLink({ href, children, ...props }: any) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(href);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`transition-opacity duration-200 ${isNavigating ? 'opacity-50' : 'opacity-100'}`}
      {...props}
    >
      {children}
    </Link>
  );
}
