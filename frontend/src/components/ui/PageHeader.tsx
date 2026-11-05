import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ink-200/80 ${className}`}
    >
      <div>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 block mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ink-500 mt-1 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};
