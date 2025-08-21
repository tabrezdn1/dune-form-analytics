'use client';

import React from 'react';
import { useAppContext } from '@/lib/contexts/AppContext';
import { Loading } from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAppContext();

  // Show loading while checking authentication
  if (state.auth.isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loading size='lg' text='Checking authentication...' />
      </div>
    );
  }

  // If not authenticated, let the API calls handle the redirect
  if (!state.auth.isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loading size='lg' text='Checking authentication...' />
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
