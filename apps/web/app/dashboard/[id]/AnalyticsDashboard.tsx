'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Form, Analytics, FieldAnalytics } from '@/lib/types'
import { useFormAnalyticsWebSocket } from '@/lib/websocket'
import { AnalyticsCard } from '@/components/charts/AnalyticsCard'
import { api, formUtils } from '@/lib/api'
import toast from 'react-hot-toast'

interface AnalyticsDashboardProps {
  form: Form
  initialAnalytics?: Analytics
}

export function AnalyticsDashboard({ form, initialAnalytics }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(initialAnalytics || null)
  const [isLoading, setIsLoading] = useState(!initialAnalytics)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // WebSocket connection for real-time updates
  const { isConnected, connectionStatus } = useFormAnalyticsWebSocket(
    form.id,
    (updatedFields: Record<string, FieldAnalytics>) => {
      setAnalytics(prev => {
        if (!prev) return null
        
        return {
          ...prev,
          byField: { ...prev.byField, ...updatedFields },
          updatedAt: new Date().toISOString(),
        }
      })
      setLastUpdated(new Date())
      toast.success('Analytics updated in real-time!', { duration: 2000 })
    }
  )

  // Load analytics if not provided initially
  useEffect(() => {
    if (!initialAnalytics) {
      loadAnalytics()
    }
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await api.getAnalytics(form.id)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    try {
      const response = await api.computeAnalytics(form.id)
      setAnalytics(response.data)
      setLastUpdated(new Date())
      toast.success('Analytics refreshed!')
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
      toast.error('Failed to refresh analytics')
    }
  }

  const exportCSV = async () => {
    try {
      const blob = await api.exportResponsesCSV(form.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.title}-responses.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast.error('Failed to export responses')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {form.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Analytics Dashboard
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Action buttons */}
              <button
                onClick={refreshAnalytics}
                className="btn-outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              <button
                onClick={exportCSV}
                className="btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Form info */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                form.status === 'published' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {formUtils.formatStatus(form.status)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <Link 
                href={formUtils.getFormShareURL(form.shareSlug)}
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                target="_blank"
              >
                {formUtils.getFormShareURL(form.shareSlug)}
              </Link>
            </div>
            
            <div>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Responses</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.totalResponses}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.completionRate ? `${Math.round(analytics.completionRate * 100)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Time</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.averageTimeToComplete 
                      ? `${Math.round(analytics.averageTimeToComplete / 60)}m`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fields</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {form.fields.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field Analytics */}
        {analytics ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Field Analytics
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.keys(analytics.byField).length} fields analyzed
              </div>
            </div>

            <div className="grid gap-8">
              {form.fields.map((field) => {
                const fieldAnalytics = analytics.byField[field.id]
                
                if (!fieldAnalytics) {
                  return (
                    <div key={field.id} className="card p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        {field.label}
                      </h3>
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No data available for this field
                        </p>
                      </div>
                    </div>
                  )
                }

                return (
                  <AnalyticsCard
                    key={field.id}
                    field={field}
                    analytics={fieldAnalytics}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Analytics Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Analytics will appear here once responses are submitted.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                href={formUtils.getFormShareURL(form.shareSlug)}
                target="_blank"
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Form
              </Link>
              
              <button
                onClick={loadAnalytics}
                className="btn-outline"
              >
                Try Loading Again
              </button>
            </div>
          </div>
        )}

        {/* Real-time indicator */}
        {isConnected && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Live Updates Active</span>
          </div>
        )}
      </div>
    </div>
  )
}
