'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Disable static generation and caching for this protected route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { notFound } from 'next/navigation';
import { FormAnalytics } from './FormAnalytics';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Loading } from '@/components/ui/Loading';
import { useAppContext } from '@/lib/contexts/AppContext';
import { api } from '@/lib/api';
import { Form } from '@/lib/types';

interface DashboardPageProps {
  params: { id: string };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load the form
        const response = await api.getForm(params.id);

        if (!response.success || !response.data) {
          setError('Form not found');
          return;
        }

        setForm(response.data);
      } catch (error) {
        setError('Failed to load form');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
          <Loading size='lg' text='Loading analytics dashboard...' />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !form) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className='min-h-screen relative overflow-hidden'>
        {/* Complementary Theme Spotlight Background */}
        <div className='absolute inset-0 bg-white dark:bg-gray-900'></div>

        {/* Light Theme: Normal Green Spotlight */}
        <div
          className='absolute inset-0 dark:hidden'
          style={{
            background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
              transparent 0%, 
              transparent 25%, 
              rgb(34 197 94 / 0.08) 45%,
              rgb(22 163 74 / 0.15) 65%,
              rgb(21 128 61 / 0.25) 85%,
              rgb(20 83 45 / 0.35) 100%)`,
          }}
        ></div>

        {/* Dark Theme: Deep Emerald Spotlight */}
        <div
          className='absolute inset-0 hidden dark:block'
          style={{
            background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
              transparent 0%, 
              transparent 20%, 
              rgb(6 78 59 / 0.15) 40%,
              rgb(6 78 59 / 0.3) 60%,
              rgb(4 47 46 / 0.5) 80%,
              rgb(6 78 59 / 0.7) 100%)`,
          }}
        ></div>

        {/* Light Theme: Corner Effects */}
        <div
          className='absolute inset-0 opacity-60 dark:hidden'
          style={{
            background: `
              radial-gradient(circle at 0% 0%, rgb(21 128 61 / 0.2) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, rgb(34 197 94 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 0% 100%, rgb(22 163 74 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgb(21 128 61 / 0.2) 0%, transparent 50%)`,
          }}
        ></div>

        {/* Dark Theme: Deep Emerald Corners */}
        <div
          className='absolute inset-0 opacity-80 hidden dark:block'
          style={{
            background: `
              radial-gradient(circle at 0% 0%, rgb(6 78 59 / 0.4) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, rgb(4 47 46 / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 0% 100%, rgb(6 78 59 / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgb(4 47 46 / 0.5) 0%, transparent 50%)`,
          }}
        ></div>

        {/* Content */}
        <div className='relative z-10'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'My Forms', href: '/forms' },
                { label: `${form.title} - Analytics`, current: true },
              ]}
            />

            {/* Modern Header */}
            <div className='mb-8'>
              <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg'>
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
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
                        {form.title}
                      </h1>
                      <p className='mt-1 text-gray-600 dark:text-gray-400 flex items-center space-x-2'>
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 10V3L4 14h7v7l9-11h-7z'
                          />
                        </svg>
                        <span>Real-time analytics and insights</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className='flex items-center space-x-3'>
                    <Link
                      href={`/builder/${form.id}`}
                      className='inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                      <span>Edit Form</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <FormAnalytics form={form} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
