import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-ink-200 rounded-3xl bg-ink-50/50 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white border border-ink-200 shadow-xs text-ink-500 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-ink-900">{title}</h4>
      {description && (
        <p className="text-xs text-ink-500 max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
