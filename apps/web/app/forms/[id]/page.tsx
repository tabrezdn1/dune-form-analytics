'use client'

import React, { useState, useEffect, useRef } from 'react'

// Disable static generation and caching for this protected route
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { notFound } from 'next/navigation'
import { FormAnalytics } from './FormAnalytics'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { Loading } from '@/components/ui/Loading'
import { useAppContext } from '@/lib/contexts/AppContext'
import { api } from '@/lib/api'
import { Form } from '@/lib/types'

interface DashboardPageProps {
  params: { id: string }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load the form
        const response = await api.getForm(params.id)
        
        if (!response.success || !response.data) {
          setError('Form not found')
          return
        }

        setForm(response.data)
      } catch (error) {
        setError('Failed to load form')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Loading size="lg" text="Loading analytics dashboard..." />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !form) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Forms', href: '/forms' },
            { label: `${form.title} - Analytics`, current: true }
          ]} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {form.title} - Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time analytics for your form responses
            </p>
          </div>
          
          <FormAnalytics form={form} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
