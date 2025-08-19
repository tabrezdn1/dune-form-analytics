'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/contexts/AppContext'
import { Loading } from '@/components/ui/Loading'
import { getCurrentToken, clearAuthAndRedirect } from '@/lib/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter()
  const { state } = useAppContext()

  // Check token expiration BEFORE rendering (synchronous check)
  const token = getCurrentToken()
  
  // If token is expired/missing and we're not loading, redirect immediately
  if (!token && !state.auth.isLoading) {
    clearAuthAndRedirect()
    return null // Don't render anything while redirecting
  }

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!state.auth.isAuthenticated && !state.auth.isLoading) {
      router.push(redirectTo)
    }
  }, [state.auth.isAuthenticated, state.auth.isLoading, router, redirectTo])

  // Show loading while checking authentication
  if (state.auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Checking authentication..." />
      </div>
    )
  }

  // If not authenticated, don't render children (will redirect)
  if (!state.auth.isAuthenticated) {
    return null
  }

  // Additional safety check - if token is expired, don't render content
  if (!token) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
