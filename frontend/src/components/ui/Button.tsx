import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'brand' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variants = {
    // Primary CTA is INK-900 black as per SaaS design system (Vercel/Linear)
    primary: 'bg-ink-900 hover:bg-ink-800 text-white rounded-full shadow-sm hover:shadow-md',
    secondary: 'bg-ink-100 hover:bg-ink-200 text-ink-900 rounded-full',
    outline: 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 rounded-full shadow-xs',
    ghost: 'text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-xl',
    brand: 'bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-sm hover:shadow-brand-500/20',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white rounded-xl shadow-xs',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5 sm:px-6 sm:py-3 gap-2',
    lg: 'text-sm sm:text-base px-6 py-3 sm:px-7 sm:py-3.5 gap-2.5',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
