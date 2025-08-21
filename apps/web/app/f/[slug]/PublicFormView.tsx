'use client';

import React, { useState } from 'react';
import { PublicForm } from '@/lib/types';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface PublicFormViewProps {
  form: PublicForm;
}

export function PublicFormView({ form }: PublicFormViewProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    answers: Array<{ fieldId: string; value: any }>;
  }) => {
    setIsSubmitting(true);

    try {
      const result = await api.submitResponse(form.id, {
        answers: data.answers,
        meta: {
          // Add any additional metadata
          referrer: document.referrer || undefined,
        },
      });

      if (result.success) {
        setIsSubmitted(true);
        toast.success(
          'Thank you! Your response has been submitted successfully.'
        );
      } else {
        // Handle validation errors
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(e => e.message).join(', ');
          toast.error(`Please fix the following errors: ${errorMessages}`);
          throw { validationErrors: result.errors };
        } else {
          toast.error(
            result.message || 'Failed to submit response. Please try again.'
          );
        }
      }
    } catch (error: any) {
      if (error.validationErrors) {
        // Re-throw validation errors to be handled by FormRenderer
        throw error;
      }

      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen relative overflow-hidden'>
        {/* Theme Toggle */}
        <ThemeToggle variant='floating' />

        {/* Professional neutral background */}
        <div className='absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'></div>

        {/* Subtle texture overlay */}
        <div
          className='absolute inset-0 opacity-30 dark:opacity-20'
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)`,
          }}
        ></div>

        <div className='relative z-10 flex items-center justify-center min-h-screen py-12'>
          <div className='max-w-md mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10 text-center'>
              {/* Success icon */}
              <div className='mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg mb-6 animate-pulse'>
                <svg
                  className='h-10 w-10 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>

              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                Thank You!
              </h1>

              <p className='text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed'>
                Your response has been submitted successfully. We appreciate
                your time and valuable feedback.
              </p>

              <button
                onClick={() => setIsSubmitted(false)}
                className='btn-outline px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5'
              >
                <div className='flex items-center justify-center space-x-2'>
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
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  <span>Submit Another Response</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Theme Toggle */}
      <ThemeToggle variant='floating' />

      {/* Professional neutral background */}
      <div className='absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'></div>

      {/* Subtle texture overlay */}
      <div
        className='absolute inset-0 opacity-30 dark:opacity-20'
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)`,
        }}
      ></div>

      <div className='relative z-10 py-8 sm:py-12 lg:py-16'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Form header */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg mb-4'>
              <svg
                className='w-6 h-6 text-white'
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
            </div>

            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-balance'>
              {form.title}
            </h1>

            {form.description && (
              <p className='text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed text-balance'>
                {form.description}
              </p>
            )}
          </div>

          {/* Form container */}
          <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8'>
            <FormRenderer
              fields={form.fields}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              showProgress={true}
            />
          </div>

          {/* Footer */}
          <div className='mt-8 text-center'>
            <div className='inline-flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50'>
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
              <span>Powered by</span>
              <a
                href='/'
                className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors'
              >
                Dune Forms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
