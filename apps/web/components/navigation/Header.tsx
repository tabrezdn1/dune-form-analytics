'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/lib/contexts/AppContext';

export function Header() {
  const pathname = usePathname();
  const { state, actions } = useAppContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Hide header on public form submission pages for clean experience
  if (pathname.startsWith('/f/')) {
    return null;
  }

  const handleLogout = () => {
    actions.logout();
    setIsProfileOpen(false);
    window.location.href = '/';
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    actions.setTheme(newTheme);
    setIsThemeOpen(false);

    // Apply theme immediately
    if (
      newTheme === 'dark' ||
      (newTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getThemeIcon = () => {
    switch (state.theme) {
      case 'light':
        return (
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
              d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
            />
          </svg>
        );
      case 'dark':
        return (
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
              d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            />
          </svg>
        );
      default: // system
        return (
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
              d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
        );
    }
  };

  const getThemeLabel = () => {
    switch (state.theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Brand Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center'>
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
              <span className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                Dune Forms
              </span>
            </Link>
          </div>

          {/* Theme Toggle & Auth Actions */}
          <div className='flex items-center space-x-4'>
            {/* Theme Toggle */}
            <div className='relative'>
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className='flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200'
                title={`Current theme: ${getThemeLabel()}`}
              >
                {getThemeIcon()}
              </button>

              {/* Simple Theme Dropdown */}
              {isThemeOpen && (
                <div className='absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden'>
                  <div className='py-1'>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        state.theme === 'system'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      System
                    </button>
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        state.theme === 'light'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        state.theme === 'dark'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              )}

              {/* Click outside to close theme dropdown */}
              {isThemeOpen && (
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setIsThemeOpen(false)}
                />
              )}
            </div>

            {state.auth.isAuthenticated ? (
              // Profile dropdown for authenticated users
              <div className='relative'>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                >
                  <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center'>
                    <span className='text-xs font-medium text-white'>
                      {state.auth.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{state.auth.user?.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50'>
                    <div className='py-1'>
                      <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700'>
                        <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {state.auth.user?.name}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {state.auth.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className='block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <svg
                          className='w-4 h-4 mr-2 inline'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                {/* Click outside to close dropdown */}
                {isProfileOpen && (
                  <div
                    className='fixed inset-0 z-40'
                    onClick={() => setIsProfileOpen(false)}
                  />
                )}
              </div>
            ) : (
              // Login/Signup buttons for unauthenticated users (with theme toggle)
              <div className='flex items-center space-x-4'>
                <Link
                  href='/login'
                  className='text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600'
                >
                  Login
                </Link>
                <Link
                  href='/signup'
                  className='text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium'
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
