'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { FieldAnalytics } from '@/lib/types'

interface RatingChartProps {
  analytics: FieldAnalytics
  chartType?: 'line' | 'bar'
  className?: string
  showStats?: boolean
}

export function RatingChart({
  analytics,
  chartType = 'bar',
  className = '',
  showStats = true
}: RatingChartProps) {
  if (analytics.count === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No ratings yet</p>
        </div>
      </div>
    )
  }

  // Prepare trend data if available
  const trendData = analytics.trend || []

  // Prepare rating distribution data (if we had individual ratings)
  // For now, we'll show summary stats
  const summaryData = [
    {
      name: 'Average',
      value: analytics.average || 0,
      color: '#3b82f6'
    },
    {
      name: 'Median',
      value: analytics.median || 0,
      color: '#10b981'
    }
  ]

  const renderChart = () => {
    if (trendData.length > 0 && chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              labelFormatter={(value) => `Date: ${value}`}
              formatter={(value: number) => [value.toFixed(2), 'Average Rating']}
              contentStyle={{ 
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // Default to summary bar chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={summaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(2), 'Rating']}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="value" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className={className}>
      <div className="h-64">
        {renderChart()}
      </div>
      
      {/* Rating Statistics */}
      {showStats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Average</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {analytics.average?.toFixed(1) || '0.0'}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Median</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {analytics.median?.toFixed(1) || '0.0'}
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Responses</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {analytics.count}
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Range</div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {field.validation?.min || 1} - {field.validation?.max || 5}
            </div>
          </div>
        </div>
      )}

      {/* Star visualization for rating scale */}
      {field.validation?.max && field.validation.max <= 5 && (
        <div className="mt-4 flex items-center justify-center space-x-1">
          {Array.from({ length: field.validation.max }, (_, index) => {
            const rating = index + 1
            const avgRating = analytics.average || 0
            const isActive = rating <= Math.round(avgRating)
            
            return (
              <svg
                key={rating}
                className={`w-6 h-6 ${isActive ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )
          })}
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Average: {analytics.average?.toFixed(1)} / {field.validation.max}
          </span>
        </div>
      )}
    </div>
  )
}
