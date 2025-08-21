import React from 'react';
import { Header } from '@/components/navigation/Header';
import {
  Breadcrumbs,
  BreadcrumbItem,
} from '@/components/navigation/Breadcrumbs';

interface PageLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageLayout({
  children,
  breadcrumbs,
  title,
  description,
  actions,
}: PageLayoutProps) {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <Header />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Page Header */}
        {(title || actions) && (
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                {title && (
                  <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
                    {title}
                  </h1>
                )}
                {description && (
                  <p className='mt-2 text-gray-600 dark:text-gray-400'>
                    {description}
                  </p>
                )}
              </div>

              {actions && (
                <div className='flex items-center space-x-4'>{actions}</div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
