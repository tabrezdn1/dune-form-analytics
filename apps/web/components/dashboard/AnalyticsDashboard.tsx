'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Form, Analytics, FieldAnalytics } from '@/lib/types'
import { useFormAnalyticsWebSocket } from '@/lib/websocket'
import { useAnalyticsData } from '@/lib/hooks/useApi'
import { useAppContext } from '@/lib/contexts/AppContext'
import { AnalyticsCard } from '@/components/charts/AnalyticsCard'
import { Loading, LoadingOverlay } from '@/components/ui/Loading'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import toast from 'react-hot-toast'

interface AnalyticsDashboardProps {
  form: Form
  initialAnalytics?: Analytics
}

// Real-time Analytics Dashboard with performance optimizations
export const AnalyticsDashboard = React.memo(function AnalyticsDashboard({ 
  form, 
  initialAnalytics 
}: AnalyticsDashboardProps) {
  const { state } = useAppContext()
  const [analytics, setAnalytics] = useState<Analytics | null>(initialAnalytics || null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Use advanced API hook
  const { 
    analytics: fetchedAnalytics, 
    fetchAnalytics, 
    exportCSV, 
    loading: apiLoading 
  } = useAnalyticsData(form.id)

  // Handle real-time analytics updates (optimized)
  const handleAnalyticsUpdate = useCallback((data: any) => {
    console.log('🔄 Analytics update received:', JSON.stringify(data, null, 2))
    
    setAnalytics(prev => {
      if (!prev) {
        console.log('❌ No previous analytics state, fetching fresh data')
        fetchAnalytics(form.id)
        return null
      }
      
      // Optimized state update
      const newAnalytics = {
        ...prev,
        byField: { ...prev.byField, ...data.byField },
        totalResponses: data.totalResponses ?? prev.totalResponses,
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
      
      console.log('✅ Analytics state updated:', {
        oldTotal: prev.totalResponses,
        newTotal: newAnalytics.totalResponses,
      })
      
      return newAnalytics
    })
    
    setLastUpdated(new Date())
    toast.success('📊 Real-time analytics updated!', { 
      duration: 2000,
      position: 'bottom-right',
    })
  }, [fetchAnalytics, form.id])

  // WebSocket connection with error handling
  const { isConnected, connectionStatus } = useFormAnalyticsWebSocket(
    form.id, 
    handleAnalyticsUpdate
  )

  // Initialize analytics if not provided
  useEffect(() => {
    if (!analytics && fetchedAnalytics) {
      setAnalytics(fetchedAnalytics)
    }
  }, [analytics, fetchedAnalytics])

  // Memoized calculations for performance
  const totalResponses = useMemo(() => analytics?.totalResponses || 0, [analytics?.totalResponses])
  
  const fieldAnalyticsArray = useMemo(() => {
    if (!analytics?.byField) return []
    
    return form.fields.map(field => ({
      field,
      analytics: analytics.byField[field.id] || { count: 0 },
    }))
  }, [analytics?.byField, form.fields])

  const connectionStatusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }, [connectionStatus])

  // Handle CSV export
  const handleExport = useCallback(async () => {
    try {
      const blob = await exportCSV(form.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.title}-responses.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }, [exportCSV, form.id, form.title])

  if (!analytics && apiLoading) {
    return <Loading fullScreen text="Loading analytics..." />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          No analytics data available
        </div>
        <button
          onClick={() => fetchAnalytics(form.id)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Load Analytics
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header with Real-time Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Form: {form.title}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time Status */}
              <div className="flex items-center space-x-2">
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} />
                <span className={clsx('text-sm font-medium', connectionStatusColor)}>
                  {isConnected ? 'Live' : connectionStatus}
                </span>
              </div>
              
              {/* Export Button */}
              <LoadingOverlay isLoading={state.loading.operations.exportCSV || false}>
                <button
                  onClick={handleExport}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Export CSV
                </button>
              </LoadingOverlay>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalResponses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Responses
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {form.fields.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Form Fields
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {new Date(lastUpdated).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last Updated
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fieldAnalyticsArray.map(({ field, analytics: fieldAnalytics }) => (
            <ErrorBoundary key={field.id}>
              <AnalyticsCard
                field={field}
                analytics={fieldAnalytics}
                totalResponses={totalResponses}
              />
            </ErrorBoundary>
          ))}
        </div>

        {/* Empty State */}
        {fieldAnalyticsArray.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No field analytics available
            </div>
            <p className="text-gray-400 text-sm">
              Analytics will appear here once responses are submitted
            </p>
          </div>
        )}

        {/* Form Link */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Share Your Form
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Send this link to collect responses
              </p>
            </div>
            <Link
              href={`/f/${form.shareSlug}`}
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Form
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
})

// Add missing clsx import fix
function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
