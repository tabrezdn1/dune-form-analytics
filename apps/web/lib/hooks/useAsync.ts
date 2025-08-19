import { useState, useCallback, useRef, useEffect } from 'react'

// Custom hook for managing async operations with loading states and error handling
export interface UseAsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  success: boolean
}

export interface UseAsyncOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options
  
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: false,
    success: false,
  })
  
  const isMountedRef = useRef(true)
  const currentPromiseRef = useRef<Promise<T> | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(async (...args: any[]) => {
    if (!isMountedRef.current) return

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const promise = asyncFunction(...args)
    currentPromiseRef.current = promise
    
    try {
      const result = await promise
      
      // Check if this is still the current promise and component is mounted
      if (currentPromiseRef.current === promise && isMountedRef.current) {
        setState({
          data: result,
          error: null,
          loading: false,
          success: true,
        })
        onSuccess?.(result)
      }
      
      return result
    } catch (error) {
      if (currentPromiseRef.current === promise && isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        setState({
          data: null,
          error: errorMessage,
          loading: false,
          success: false,
        })
        onError?.(errorMessage)
      }
      throw error
    }
  }, [asyncFunction, onSuccess, onError])

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({
        data: null,
        error: null,
        loading: false,
        success: false,
      })
    }
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    ...state,
    execute,
    reset,
  }
}
