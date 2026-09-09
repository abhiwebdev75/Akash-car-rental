import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-brand-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="mt-3 text-xs font-medium text-slate-500 tracking-wide">{text}</p>}
    </div>
  );
}

