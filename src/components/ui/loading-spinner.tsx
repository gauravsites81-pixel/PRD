import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-r-2 ${sizeClasses[size]} ${className}`}>
      <style jsx>{`
        border-top-color: transparent;
        border-right-color: transparent;
        animation: spin 1s linear infinite;
        border-color: rgb(59, 130, 246) transparent;
        border-top-color: rgb(59, 130, 246);
        border-right-color: rgb(59, 130, 246);
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
