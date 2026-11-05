import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-ink-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full text-sm px-4 py-2.5 rounded-xl border border-ink-200 bg-white text-ink-900 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 transition cursor-pointer disabled:bg-ink-100 disabled:text-ink-500 ${
            error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-xs text-danger-500 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
