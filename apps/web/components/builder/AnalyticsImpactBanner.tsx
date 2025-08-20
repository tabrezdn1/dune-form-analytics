import React from 'react'
import { FormChangeAnalysis } from '@/lib/form-change-analyzer'

interface AnalyticsImpactBannerProps {
  analysis: FormChangeAnalysis
  responseCount?: number
  className?: string
}

export function AnalyticsImpactBanner({ 
  analysis, 
  responseCount = 0,
  className = '' 
}: AnalyticsImpactBannerProps) {
  if (!analysis.hasChanges) {
    return null
  }

  const hasResponses = responseCount > 0

  if (analysis.willResetAnalytics) {
    return (
      <div className={`rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Analytics Will Be Reset
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              {hasResponses && (
                <p className="mb-2">
                  Your form has <strong>{responseCount} response{responseCount !== 1 ? 's' : ''}</strong>.
                </p>
              )}
              <p>The following changes will reset analytics to zero:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {analysis.deletedFields.length > 0 && (
                  <li>Deleted field{analysis.deletedFields.length > 1 ? 's' : ''}: {analysis.deletedFields.join(', ')}</li>
                )}
                {analysis.typeChangedFields.map((change, idx) => (
                  <li key={idx}>
                    Field type changed: {change.from} → {change.to}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show positive message for compatible changes
  if (analysis.compatibleChanges.length > 0 && hasResponses) {
    return (
      <div className={`rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Analytics Will Be Preserved
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>Your {responseCount} response{responseCount !== 1 ? 's' : ''} and analytics data will be preserved.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function AnalyticsImpactIndicator({ 
  analysis,
  className = '' 
}: { 
  analysis: FormChangeAnalysis
  className?: string 
}) {
  // Only show indicator when analytics will be reset, not for normal preservation
  if (!analysis.hasChanges || !analysis.willResetAnalytics) {
    return null
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 ${className}`}>
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      Analytics will reset
    </div>
  )
}
