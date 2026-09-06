import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, disabled, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex items-start space-x-3 ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-xs leading-5">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`font-semibold cursor-pointer select-none ${
                  disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-slate-500 select-none ${disabled ? 'text-slate-300' : ''}`}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
