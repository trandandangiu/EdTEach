import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center p-1 bg-ink-100 rounded-2xl border border-ink-200/60 overflow-x-auto max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-white text-ink-900 shadow-xs shadow-ink-200/50'
                : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-ink-100 text-ink-900' : 'bg-ink-200/60 text-ink-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
