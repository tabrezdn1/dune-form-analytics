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

export default async function DashboardPage({ params }: DashboardPageProps) {
  try {
    const response = await api.getForm(params.id)
    
    if (!response.success || !response.data) {
      notFound()
    }

    const form = response.data

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {form.title} - Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time analytics for your form responses
            </p>
          </div>
          
          <AnalyticsDashboard formId={params.id} form={form} />
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
