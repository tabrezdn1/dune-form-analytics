'use client'

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'

// Application State Types
interface AppState {
  theme: 'light' | 'dark' | 'system'
  user: null | {
    id: string
    email: string
    name: string
  }
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
  errors: {
    global: string | null
    operations: Record<string, string>
  }
}

// Application Actions
type AppAction = 
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'LOGOUT' }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_OPERATION_LOADING'; payload: { operation: string; loading: boolean } }
  | { type: 'SET_GLOBAL_ERROR'; payload: string | null }
  | { type: 'SET_OPERATION_ERROR'; payload: { operation: string; error: string | null } }
  | { type: 'CLEAR_ERRORS' }

// Initial State
const initialState: AppState = {
  theme: 'system',
  user: null,
  loading: {
    global: false,
    operations: {},
  },
  errors: {
    global: null,
    operations: {},
  },
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
      
    case 'SET_GLOBAL_LOADING':
      return { 
        ...state, 
        loading: { ...state.loading, global: action.payload } 
      }
      
    case 'SET_OPERATION_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          operations: {
            ...state.loading.operations,
            [action.payload.operation]: action.payload.loading,
          },
        },
      }
      
    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        errors: { ...state.errors, global: action.payload },
      }
      
    case 'SET_OPERATION_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          operations: {
            ...state.errors.operations,
            [action.payload.operation]: action.payload.error,
          },
        },
      }
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: { global: null, operations: {} },
      }
      
    default:
      return state
  }
}

// Context Interface
interface AppContextValue {
  state: AppState
  actions: {
    setTheme: (theme: AppState['theme']) => void
    setUser: (user: AppState['user']) => void
    logout: () => void
    setGlobalLoading: (loading: boolean) => void
    setOperationLoading: (operation: string, loading: boolean) => void
    setGlobalError: (error: string | null) => void
    setOperationError: (operation: string, error: string | null) => void
    clearErrors: () => void
  }
}

// Context
const AppContext = createContext<AppContextValue | undefined>(undefined)

// Hook to use App Context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// App Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Actions
  const actions = {
    setTheme: useCallback((theme: AppState['theme']) => {
      dispatch({ type: 'SET_THEME', payload: theme })
      localStorage.setItem('theme', theme)
    }, []),
    
    setUser: useCallback((user: AppState['user']) => {
      dispatch({ type: 'SET_USER', payload: user })
    }, []),
    
    logout: useCallback(() => {
      dispatch({ type: 'LOGOUT' })
      localStorage.removeItem('authToken')
    }, []),
    
    setGlobalLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading })
    }, []),
    
    setOperationLoading: useCallback((operation: string, loading: boolean) => {
      dispatch({ type: 'SET_OPERATION_LOADING', payload: { operation, loading } })
    }, []),
    
    setGlobalError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_GLOBAL_ERROR', payload: error })
    }, []),
    
    setOperationError: useCallback((operation: string, error: string | null) => {
      dispatch({ type: 'SET_OPERATION_ERROR', payload: { operation, error } })
    }, []),
    
    clearErrors: useCallback(() => {
      dispatch({ type: 'CLEAR_ERRORS' })
    }, []),
  }

  const contextValue: AppContextValue = {
    state,
    actions,
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}
