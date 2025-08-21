'use client';

import React, { useState } from 'react';
import { FormField, FieldAnalytics } from '@/lib/types';
import { DistributionChart } from './DistributionChart';
import { RatingChart } from './RatingChart';

interface AnalyticsCardProps {
  field: FormField;
  analytics: FieldAnalytics;
  totalFormResponses?: number;
  className?: string;
}

export function AnalyticsCard({
  field,
  analytics,
  totalFormResponses = 0,
  className = '',
}: AnalyticsCardProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');

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
        );

      case 'rating':
        return (
          <RatingChart
            field={field}
            analytics={analytics}
            chartType={chartType as 'line' | 'bar'}
          />
        );

      case 'text':
        return (
          <div className='space-y-4'>
            {/* Response Overview */}
            <div className='bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 p-4'>
              {/* Horizontal Response Bar */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400 font-medium'>
                    Response Collection
                  </span>
                  <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>
                    {analytics.count > 0 ? 'Active' : 'No responses'}
                  </span>
                </div>

                {/* Visual Response Timeline */}
                <div className='relative'>
                  <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000'
                      style={{
                        width:
                          totalFormResponses > 0
                            ? `${Math.round((analytics.count / totalFormResponses) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className='flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400'>
                    <span>0</span>
                    <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                      {analytics.count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200/50 dark:border-gray-600/50'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <p className='text-gray-700 dark:text-gray-300 font-semibold'>
                Unsupported Field Type
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                {field.type}
              </p>
            </div>
          </div>
        );
    }
  };

  const getFieldTypeIcon = () => {
    switch (field.type) {
      case 'text':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'mcq':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      case 'checkbox':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            />
          </svg>
        );
      case 'rating':
        return (
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
        );
      default:
        return null;
    }
  };

  const getChartTypeOptions = () => {
    switch (field.type) {
      case 'mcq':
      case 'checkbox':
        return [
          { value: 'bar', label: 'Bar Chart' },
          { value: 'pie', label: 'Pie Chart' },
        ];
      case 'rating':
        return [{ value: 'bar', label: 'Summary' }];
      default:
        return [];
    }
  };

  const chartOptions = getChartTypeOptions();

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-700/30 overflow-hidden ${className}`}
    >
      {/* Modern Card Header */}
      <div className='bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-5 border-b border-emerald-200/30 dark:border-emerald-700/30'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg'>
              <div className='text-white'>{getFieldTypeIcon()}</div>
            </div>
            <div>
              <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                {field.label}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 capitalize flex items-center space-x-2'>
                <span>{field.type} field</span>
                {field.required && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'>
                    Required
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Modern Chart type selector */}
          {chartOptions.length > 0 && (
            <div className='flex items-center bg-white/60 dark:bg-gray-700/60 rounded-xl p-1 backdrop-blur-sm'>
              {chartOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setChartType(option.value as any)}
                  className={`
                    px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                    ${
                      chartType === option.value
                        ? 'bg-emerald-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-600/50'
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

      {/* Modern Card Body */}
      <div className='p-4'>{renderChart()}</div>

      {/* Modern Card Footer */}
      <div className='bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-700/50 px-5 py-4 border-t border-gray-200/50 dark:border-gray-700/50'>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Total Responses
              </p>
              <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                {analytics.count.toLocaleString()}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Response Rate
              </p>
              <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {totalFormResponses > 0
                  ? `${Math.round((analytics.count / totalFormResponses) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
