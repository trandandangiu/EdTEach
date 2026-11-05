import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'gold' | 'danger' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) => {
  const variants = {
    neutral: 'text-[11px] font-medium bg-ink-100 text-ink-600',
    brand: 'text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100',
    gold: 'text-xs font-semibold text-gold-500 bg-amber-50 border border-amber-200',
    danger: 'text-xs font-semibold text-danger-500 bg-rose-50 border border-rose-200',
    info: 'text-xs font-semibold text-info-500 bg-sky-50 border border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
