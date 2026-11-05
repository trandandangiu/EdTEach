import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  className?: string;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendType = 'positive',
  subtext,
  className = '',
  children,
}) => {
  const trendColors = {
    positive: 'text-brand-600 bg-brand-50 border-brand-100',
    negative: 'text-danger-500 bg-rose-50 border-rose-200',
    neutral: 'text-ink-600 bg-ink-100 border-ink-200',
  };

  return (
    <Card variant="static" padding="md" className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center text-ink-700">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${trendColors[trendType]}`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-ink-400">{subtext}</p>}
      {children}
    </Card>
  );
};
