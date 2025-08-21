'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Application Error Boundary
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
          <div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
            <div className='flex items-center mb-4'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-8 w-8 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                  Something went wrong
                </h3>
              </div>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                An unexpected error occurred. Please try refreshing the page or
                contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mt-4'>
                  <summary className='text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer'>
                    Error Details (Development)
                  </summary>
                  <pre className='mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto'>
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => window.location.reload()}
                className='flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors'
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.history.back()}
                className='flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors'
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional Error Boundary Hook
export function useErrorHandler() {
  const handleError = React.useCallback(
    (error: Error, errorInfo?: ErrorInfo) => {
      // eslint-disable-next-line no-console
      console.error('Application error:', error, errorInfo);

      // In production, you would send this to an error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { extra: errorInfo })
      }
    },
    []
  );

  return handleError;
}
