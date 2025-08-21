'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAppContext } from '@/lib/contexts/AppContext';

export default function DashboardPage() {
  const { state } = useAppContext();

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
            {/* Welcome Header */}
            <div className='mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
                Welcome back, {state.auth.user?.name}
              </h1>
              <p className='mt-2 text-gray-600 dark:text-gray-400'>
                Manage your forms and view analytics from your dashboard
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
              <Link
                href='/builder'
                className='group bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm p-8 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10 transition-all duration-200 transform hover:-translate-y-1 hover:bg-white/95 dark:hover:bg-gray-800/95'
              >
                <div className='text-center'>
                  <div className='w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-200 shadow-lg'>
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
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-3'>
                    Create Form
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                    Build dynamic forms with drag-and-drop interface
                  </p>
                </div>
              </Link>

              <Link
                href='/forms'
                className='group bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm p-8 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10 transition-all duration-200 transform hover:-translate-y-1 hover:bg-white/95 dark:hover:bg-gray-800/95'
              >
                <div className='text-center'>
                  <div className='w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-200 shadow-lg'>
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
                        d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                      />
                    </svg>
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-3'>
                    My Forms
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                    Manage and analyze your published forms
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
