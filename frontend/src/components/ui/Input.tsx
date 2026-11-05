import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-ink-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 pointer-events-none text-ink-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full text-sm py-2.5 rounded-xl border border-ink-200 bg-white text-ink-900 placeholder:text-ink-400 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 transition disabled:bg-ink-100 disabled:text-ink-500 ${
              icon ? 'pl-10 pr-4' : 'px-4'
            } ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-danger-500 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
