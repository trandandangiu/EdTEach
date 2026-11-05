import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  className = '',
  ...props
}) => {
  const variants = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`animate-pulse bg-ink-200/70 ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
