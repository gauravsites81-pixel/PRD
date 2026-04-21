import React from 'react';
import { LoadingSpinner } from './loading-spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 focus:ring-offset-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-red-500 disabled:bg-red-300 disabled:cursor-not-allowed',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 focus:ring-offset-green-500 disabled:bg-green-300 disabled:cursor-not-allowed',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const typeClasses = {
    button: 'border border-transparent',
    submit: 'border border-transparent',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${typeClasses[type]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? (
        <div className="flex items-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2">{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
