import React from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rounded' | 'circle';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-14 sm:w-14 sm:h-16 text-base',
    xl: 'w-20 h-24 text-xl',
  };

  const shapes = {
    circle: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 border border-ink-200 overflow-hidden bg-ink-100 ${sizes[size]} ${shapes[shape]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-semibold text-ink-700">{initials}</span>
      )}
    </div>
  );
};
