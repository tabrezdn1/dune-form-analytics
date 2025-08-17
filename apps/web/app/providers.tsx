'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

// Global App State Types
interface AppState {
  theme: 'light' | 'dark' | 'system'
  user: null | {
    id: string
    email: string
    name: string
  }
}

type AppAction = 
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'LOGOUT' }

// Initial State
const initialState: AppState = {
  theme: 'system',
  user: null,
}

// App Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'LOGOUT':
      return { ...state, user: null }
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Hook to use app context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

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

// Main Providers Component
export function Providers({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
    </AppContext.Provider>
  )
}
