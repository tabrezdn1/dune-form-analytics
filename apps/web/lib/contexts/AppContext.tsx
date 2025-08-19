'use client'

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react'

// User Type
interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

// Application State Types
interface AppState {
  theme: 'light' | 'dark' | 'system'
  auth: {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
  }
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
  errors: {
    global: string | null
    operations: Record<string, string | null>
  }
}

// Application Actions
type AppAction = 
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'SET_AUTH_USER'; payload: User | null }
  | { type: 'SET_AUTH_TOKENS'; payload: { token: string; refreshToken: string } }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_OPERATION_LOADING'; payload: { operation: string; loading: boolean } }
  | { type: 'SET_GLOBAL_ERROR'; payload: string | null }
  | { type: 'SET_OPERATION_ERROR'; payload: { operation: string; error: string | null } }
  | { type: 'CLEAR_ERRORS' }

// Initial State
const initialState: AppState = {
  theme: 'system',
  auth: {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  },
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
      
    case 'SET_AUTH_USER':
      return { 
        ...state, 
        auth: { 
          ...state.auth, 
          user: action.payload,
          isAuthenticated: action.payload !== null 
        } 
      }
      
    case 'SET_AUTH_TOKENS':
      return { 
        ...state, 
        auth: { 
          ...state.auth, 
          token: action.payload.token,
          refreshToken: action.payload.refreshToken,
          isAuthenticated: true 
        } 
      }
      
    case 'SET_AUTH_LOADING':
      return { 
        ...state, 
        auth: { ...state.auth, isLoading: action.payload } 
      }
      
    case 'LOGOUT':
      return { 
        ...state, 
        auth: {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        } 
      }
      
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
    setAuthUser: (user: User | null) => void
    setAuthTokens: (token: string, refreshToken: string) => void
    setAuthLoading: (loading: boolean) => void
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, name: string) => Promise<void>
    logout: () => void
    refreshToken: () => Promise<void>
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
    
    setAuthUser: useCallback((user: User | null) => {
      dispatch({ type: 'SET_AUTH_USER', payload: user })
    }, []),
    
    setAuthTokens: useCallback((token: string, refreshToken: string) => {
      dispatch({ type: 'SET_AUTH_TOKENS', payload: { token, refreshToken } })
      localStorage.setItem('authToken', token)
      localStorage.setItem('refreshToken', refreshToken)
    }, []),
    
    setAuthLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_AUTH_LOADING', payload: loading })
    }, []),
    
    login: useCallback(async (email: string, password: string) => {
      dispatch({ type: 'SET_AUTH_LOADING', payload: true })
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }
        
        // Set user and tokens
        dispatch({ type: 'SET_AUTH_USER', payload: data.data.user })
        dispatch({ type: 'SET_AUTH_TOKENS', payload: { 
          token: data.data.accessToken, 
          refreshToken: data.data.refreshToken 
        }})
        
        localStorage.setItem('authToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        
      } catch (error) {
        dispatch({ type: 'SET_GLOBAL_ERROR', payload: error instanceof Error ? error.message : 'Login failed' })
        throw error
      } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false })
      }
    }, []),
    
    signup: useCallback(async (email: string, password: string, name: string) => {
      dispatch({ type: 'SET_AUTH_LOADING', payload: true })
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }
        
        // Set user and tokens
        dispatch({ type: 'SET_AUTH_USER', payload: data.data.user })
        dispatch({ type: 'SET_AUTH_TOKENS', payload: { 
          token: data.data.accessToken, 
          refreshToken: data.data.refreshToken 
        }})
        
        localStorage.setItem('authToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        
      } catch (error) {
        dispatch({ type: 'SET_GLOBAL_ERROR', payload: error instanceof Error ? error.message : 'Signup failed' })
        throw error
      } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false })
      }
    }, []),
    
    logout: useCallback(() => {
      dispatch({ type: 'LOGOUT' })
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
    }, []),
    
    refreshToken: useCallback(async () => {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        dispatch({ type: 'LOGOUT' })
        return
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Token refresh failed')
        }
        
        // Update tokens
        dispatch({ type: 'SET_AUTH_TOKENS', payload: { 
          token: data.data.accessToken, 
          refreshToken: data.data.refreshToken 
        }})
        
        localStorage.setItem('authToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        
      } catch (error) {
        dispatch({ type: 'LOGOUT' })
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        throw error
      }
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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (token && refreshToken) {
      // Set loading while verifying token
      dispatch({ type: 'SET_AUTH_LOADING', payload: true })
      
      // Verify token is still valid by calling /me endpoint
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data) {
          dispatch({ type: 'SET_AUTH_USER', payload: data.data })
          dispatch({ type: 'SET_AUTH_TOKENS', payload: { token, refreshToken } })
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
        }
      })
      .catch(() => {
        // Token is invalid, clear storage
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
      })
      .finally(() => {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false })
      })
    }
  }, [])

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
