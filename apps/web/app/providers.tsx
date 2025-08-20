'use client'

import React, { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from '@/lib/contexts/AppContext'

// Theme Provider Component
function ThemeProvider({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    const updateTheme = () => {
      const theme = localStorage.getItem('theme') || 'system'
      
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Initial theme application
    updateTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)

    // Listen for storage changes (theme updates from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return <>{children}</>
}

// Main Providers Component
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
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
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontSize: '14px',
              fontWeight: '500',
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
    </AppProvider>
  )
}

