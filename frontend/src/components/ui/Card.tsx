import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'interactive' | 'static' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'static',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    // Airbnb-style lift on hover
    interactive:
      'bg-white rounded-3xl border border-ink-200 hover:border-transparent hover:shadow-xl hover:shadow-ink-300/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer',
    static: 'bg-white rounded-3xl border border-ink-200 shadow-sm shadow-ink-200/40',
    subtle: 'bg-ink-50 rounded-2xl border border-ink-200/80',
  };

  return (
    <div
      className={`${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
