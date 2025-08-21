import React from 'react';
import { clsx } from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

// Flexible Loading component with multiple variants
export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = clsx(
    'flex flex-col items-center justify-center',
    fullScreen && 'min-h-screen',
    className
  );

  const renderSpinner = () => (
    <svg
      className={clsx(sizeClasses[size], 'animate-spin text-primary-600')}
      fill='none'
      viewBox='0 0 24 24'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  );

  const renderDots = () => (
    <div className='flex space-x-1'>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={clsx(
            'bg-primary-600 rounded-full animate-pulse',
            size === 'sm' && 'w-1 h-1',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={clsx(
        sizeClasses[size],
        'bg-primary-600 rounded-full animate-pulse'
      )}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {text && (
        <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 animate-pulse'>
          {text}
        </p>
      )}
    </div>
  );
}

// Skeleton Loading Component
export function Skeleton({
  className,
  rows = 1,
  ...props
}: {
  className?: string;
  rows?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('animate-pulse', className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-gray-200 dark:bg-gray-700 rounded',
            i > 0 && 'mt-2',
            'h-4'
          )}
        />
      ))}
    </div>
  );
}

// Loading Overlay Component
export function LoadingOverlay({
  isLoading,
  children,
  text = 'Loading...',
}: {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}) {
  return (
    <div className='relative'>
      {children}
      {isLoading && (
        <div className='absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50'>
          <Loading text={text} />
        </div>
      )}
    </div>
  );
}
