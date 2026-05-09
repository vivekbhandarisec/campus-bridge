import React from 'react';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function PremiumCard({ children, className, hover = true, glass = false }: PremiumCardProps) {
  const baseClasses = glass 
    ? 'glass-card rounded-2xl border-white/20 bg-white/70 backdrop-blur-xl'
    : 'app-card rounded-2xl border-slate-200/50 bg-white/90 backdrop-blur-md';
  
  const hoverClasses = hover 
    ? 'hover:shadow-luxury hover:-translate-y-1 transition-all duration-300'
    : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className || ''}`}>
      {children}
    </div>
  );
}

interface PremiumCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardHeader({ children, className }: PremiumCardHeaderProps) {
  return (
    <div className={`p-6 pb-4 ${className || ''}`}>
      {children}
    </div>
  );
}

interface PremiumCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardFooter({ children, className }: PremiumCardFooterProps) {
  return (
    <div className={`p-6 pt-4 border-t border-slate-100/50 ${className || ''}`}>
      {children}
    </div>
  );
}

interface PremiumCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCardContent({ children, className }: PremiumCardContentProps) {
  return (
    <div className={`p-6 ${className || ''}`}>
      {children}
    </div>
  );
}
