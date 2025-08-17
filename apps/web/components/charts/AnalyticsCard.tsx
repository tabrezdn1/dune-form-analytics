'use client'

import React, { useState } from 'react'
import { FormField, FieldAnalytics } from '@/lib/types'
import { DistributionChart } from './DistributionChart'
import { RatingChart } from './RatingChart'

interface AnalyticsCardProps {
  field: FormField
  analytics: FieldAnalytics
  className?: string
}

export function AnalyticsCard({ field, analytics, className = '' }: AnalyticsCardProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')

  const renderChart = () => {
    switch (field.type) {
      case 'mcq':
      case 'checkbox':
        return (
          <DistributionChart
            field={field}
            analytics={analytics}
            chartType={chartType as 'bar' | 'pie'}
          />
        )
      
      case 'rating':
        return (
          <RatingChart
            analytics={analytics}
            chartType={chartType as 'line' | 'bar'}
          />
        )
      
      case 'text':
        return (
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Text responses</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total responses
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Unsupported field type: {field.type}
            </p>
          </div>
        )
    }
  }

  const getFieldTypeIcon = () => {
    switch (field.type) {
      case 'text':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'mcq':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'checkbox':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'rating':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getChartTypeOptions = () => {
    switch (field.type) {
      case 'mcq':
      case 'checkbox':
        return [
          { value: 'bar', label: 'Bar Chart' },
          { value: 'pie', label: 'Pie Chart' },
        ]
      case 'rating':
        return [
          { value: 'bar', label: 'Summary' },
          { value: 'line', label: 'Trend' },
        ]
      default:
        return []
    }
  }

  const chartOptions = getChartTypeOptions()

  return (
    <div className={`card ${className}`}>
      {/* Card Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <div className="text-primary-600 dark:text-primary-400">
                {getFieldTypeIcon()}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {field.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {field.type} field
                {field.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </p>
            </div>
          </div>

          {/* Chart type selector */}
          {chartOptions.length > 0 && (
            <div className="flex items-center space-x-2">
              {chartOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setChartType(option.value as any)}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-colors
                    ${chartType === option.value
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {renderChart()}
      </div>

      {/* Card Footer - Response Count */}
      <div className="card-footer">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>Total Responses</span>
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {analytics.count}
          </div>
        </div>
      </div>
    </div>
  )
}
