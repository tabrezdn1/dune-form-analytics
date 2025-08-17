import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { api } from '@/lib/api'

interface DashboardPageProps {
  params: { id: string }
}

// Generate metadata for the dashboard
export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  try {
    const response = await api.getForm(params.id)
    const form = response.data

    if (!form) {
      return {
        title: 'Dashboard Not Found - Dune Form Analytics',
      }
    }

    return {
      title: `${form.title} - Analytics Dashboard`,
      description: `Real-time analytics dashboard for ${form.title}`,
      robots: {
        index: false, // Analytics dashboards should not be indexed
        follow: false,
      },
    }
  } catch (error) {
    return {
      title: 'Dashboard Not Found - Dune Form Analytics',
    }
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  // For demo purposes, redirect to sample dashboard if API is not available
  // In production, this would fetch real data from the API
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Dashboard Loading...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This dashboard requires the backend API to be running.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            For now, try the demo dashboard with sample data.
          </p>
        </div>
        
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <a
            href="/dashboard/sample"
            className="btn-primary inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Demo Dashboard
          </a>
          
          <a
            href="/f/sample-feedback-form"
            className="btn-outline inline-flex items-center"
          >
            Try Sample Form
          </a>
        </div>
      </div>
    </div>
  )
}
