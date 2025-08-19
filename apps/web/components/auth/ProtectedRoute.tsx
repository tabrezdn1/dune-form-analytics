'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/contexts/AppContext'
import { Loading } from '@/components/ui/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter()
  const { state } = useAppContext()

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

  // Render protected content
  return <>{children}</>
}
