'use client'

import React, { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from '@/lib/contexts/AppContext'
import { WebSocketProvider } from '@/lib/contexts/WebSocketContext'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

// Theme Provider Component
function ThemeProvider({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    // Apply theme class to document
    const theme = localStorage.getItem('theme') || 'system'
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return <>{children}</>
}

// Application Providers with proper context nesting
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AppProvider>
        <WebSocketProvider>
          <ThemeProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </ThemeProvider>
        </WebSocketProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}

// Legacy hook for backward compatibility
export function useApp() {
  console.warn('useApp is deprecated. Use useAppContext from @/lib/contexts/AppContext instead.')
  return {
    state: { theme: 'system', user: null },
    dispatch: () => {},
  }
}