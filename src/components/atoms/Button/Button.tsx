import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300',
    outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md',
    md: 'text-xs font-semibold px-4 py-2 rounded-lg',
    lg: 'text-sm font-semibold px-5 py-2.5 rounded-lg',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
