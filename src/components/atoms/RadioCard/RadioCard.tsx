import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface RadioCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  title: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo' | 'blue';
  icon?: ReactNode;
  selected?: boolean;
}

export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(
  (
    {
      className = '',
      title,
      description,
      badgeText,
      badgeVariant = 'slate',
      icon,
      selected,
      id,
      name,
      value,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const radioId = id || `radio-${name}-${value}`;

    const badgeColorMap = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
      <label
        htmlFor={radioId}
        className={`relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''
        } ${
          selected
            ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/10 shadow-xs'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
        } ${className}`}
      >
        <input
          ref={ref}
          type="radio"
          id={radioId}
          name={name}
          value={value}
          disabled={disabled}
          checked={selected}
          onChange={onChange}
          className="sr-only"
          {...props}
        />

        <div className="flex items-start space-x-3 w-full">
          {/* Custom radio indicator circle */}
          <div
            className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
              selected
                ? 'border-blue-600 bg-blue-600'
                : 'border-slate-300 bg-white'
            }`}
          >
            {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {icon && <span className="shrink-0 text-sm">{icon}</span>}
                <span className={`text-sm font-semibold tracking-tight ${selected ? 'text-blue-950' : 'text-slate-900'}`}>
                  {title}
                </span>
              </div>
              {badgeText && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColorMap[badgeVariant]}`}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {description && (
              <p className={`text-xs mt-1 leading-relaxed ${selected ? 'text-slate-600' : 'text-slate-500'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
      </label>
    );
  }
);
RadioCard.displayName = 'RadioCard';
