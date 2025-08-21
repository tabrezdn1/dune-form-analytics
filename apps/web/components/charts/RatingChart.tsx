'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { FieldAnalytics, FormField } from '@/lib/types';

interface RatingChartProps {
  field: FormField;
  analytics: FieldAnalytics;
  chartType?: 'line' | 'bar';
  className?: string;
  showStats?: boolean;
}

export function RatingChart({
  field,
  analytics,
  chartType = 'bar',
  className = '',
  showStats = true,
}: RatingChartProps) {
  if (analytics.count === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/30 dark:border-yellow-700/30 ${className}`}
      >
        <div className='text-center'>
          <div className='w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <svg
              className='w-8 h-8 text-white'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
            </svg>
          </div>
          <h4 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-2'>
            No Ratings Yet
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            Waiting for rating submissions
          </p>
        </div>
      </div>
    );
  }

  // Prepare trend data if available
  const trendData = analytics.trend || [];

  // Prepare rating distribution data (if we had individual ratings)
  // For now, we'll show summary stats
  const summaryData = [
    {
      name: 'Average',
      value: analytics.average || 0,
      color: '#10b981',
    },
    {
      name: 'Median',
      value: analytics.median || 0,
      color: '#3b82f6',
    },
  ];

  const renderChart = () => {
    if (trendData.length > 0 && chartType === 'line') {
      return (
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={trendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis
              dataKey='date'
              stroke='#6b7280'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#6b7280'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={value => `Date: ${value}`}
              formatter={(value: number) => [
                value.toFixed(2),
                'Average Rating',
              ]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                borderRadius: '0.75rem',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <Line
              type='monotone'
              dataKey='value'
              stroke='#10b981'
              strokeWidth={4}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
              activeDot={{
                r: 8,
                stroke: '#10b981',
                strokeWidth: 3,
                fill: '#ffffff',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default to summary bar chart
    return (
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={summaryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
          <XAxis
            dataKey='name'
            stroke='#6b7280'
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke='#6b7280'
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), 'Rating']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              borderRadius: '0.75rem',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Bar dataKey='value' fill='#10b981' radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className={className}>
      <div className='h-56'>{renderChart()}</div>

      {/* Compact Rating Statistics */}
      {showStats && (
        <div className='mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30'>
          <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4'>
            Statistics
          </h4>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <div className='bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-3 rounded-lg border border-emerald-200/20 dark:border-emerald-700/20 text-center'>
              <div className='text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                {analytics.average?.toFixed(1) || '0.0'}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                Average
              </div>
            </div>

            <div className='bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-3 rounded-lg border border-teal-200/20 dark:border-teal-700/20 text-center'>
              <div className='text-lg font-bold text-teal-600 dark:text-teal-400'>
                {analytics.median?.toFixed(1) || '0.0'}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                Median
              </div>
            </div>

            <div className='bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-3 rounded-lg border border-green-200/20 dark:border-green-700/20 text-center'>
              <div className='text-lg font-bold text-green-600 dark:text-green-400'>
                {analytics.count.toLocaleString()}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                Responses
              </div>
            </div>

            <div className='bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-3 rounded-lg border border-cyan-200/20 dark:border-cyan-700/20 text-center'>
              <div className='text-lg font-bold text-cyan-600 dark:text-cyan-400'>
                {field.validation?.min || 1} - {field.validation?.max || 5}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
                Range
              </div>
            </div>
          </div>
        </div>
      )}

      {showStats && analytics.average && (
        <div className='mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200/30 dark:border-yellow-700/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-1'>
                {Array.from(
                  { length: field.validation?.max || 5 },
                  (_, index) => {
                    const rating = index + 1;
                    const avgRating = analytics.average || 0;
                    const isActive = rating <= Math.round(avgRating);

                    return (
                      <svg
                        key={rating}
                        className={`w-5 h-5 ${
                          isActive
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    );
                  }
                )}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                <span className='font-bold text-yellow-600 dark:text-yellow-400'>
                  {analytics.average?.toFixed(1)}
                </span>
                <span className='mx-1'>/</span>
                <span>{field.validation?.max || 5}</span>
              </div>
            </div>

            <div className='text-right'>
              <div className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                {analytics.count.toLocaleString()}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                ratings
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
